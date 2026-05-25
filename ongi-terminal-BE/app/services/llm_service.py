"""
LLM 추상화 레이어 — LLM_PROVIDER 환경변수로 Claude/OpenAI/Gemini 전환
"""
import json
from abc import ABC, abstractmethod

import httpx

from app.config import settings


class LLMProvider(ABC):
    @abstractmethod
    async def chat(self, messages: list[dict], system: str | None = None, max_tokens: int = 1024) -> str: ...

    @abstractmethod
    async def chat_with_image(
        self,
        prompt: str,
        image_base64: str,
        media_type: str = "image/jpeg",
        system: str | None = None,
        max_tokens: int = 1024,
    ) -> str: ...


class LLMServiceError(Exception):
    """User-displayable LLM service error."""

    pass


class ClaudeProvider(LLMProvider):
    def __init__(self):
        import anthropic
        self._client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self._model = settings.LLM_MODEL_CLAUDE

    async def chat(self, messages: list[dict], system: str | None = None, max_tokens: int = 1024) -> str:
        kwargs = {"model": self._model, "max_tokens": max_tokens, "messages": messages}
        if system:
            kwargs["system"] = system
        resp = await self._client.messages.create(**kwargs)
        return resp.content[0].text

    async def chat_with_image(
        self,
        prompt: str,
        image_base64: str,
        media_type: str = "image/jpeg",
        system: str | None = None,
        max_tokens: int = 1024,
    ) -> str:
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": image_base64}},
                    {"type": "text", "text": prompt},
                ],
            }
        ]
        return await self.chat(messages, system=system, max_tokens=max_tokens)


class OpenAIProvider(LLMProvider):
    def __init__(self):
        from openai import AsyncOpenAI
        self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self._model = settings.LLM_MODEL_OPENAI

    async def chat(self, messages: list[dict], system: str | None = None, max_tokens: int = 1024) -> str:
        all_messages = []
        if system:
            all_messages.append({"role": "system", "content": system})
        all_messages.extend(messages)
        resp = await self._client.chat.completions.create(
            model=self._model, messages=all_messages, max_tokens=max_tokens
        )
        return resp.choices[0].message.content

    async def chat_with_image(
        self,
        prompt: str,
        image_base64: str,
        media_type: str = "image/jpeg",
        system: str | None = None,
        max_tokens: int = 1024,
    ) -> str:
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{image_base64}"}},
                    {"type": "text", "text": prompt},
                ],
            }
        ]
        return await self.chat(messages, system=system, max_tokens=max_tokens)


class GeminiProvider(LLMProvider):
    def __init__(self):
        self._client = httpx.AsyncClient(timeout=30.0)
        self._api_key = settings.GEMINI_API_KEY
        self._model = settings.LLM_MODEL_GEMINI

    async def chat(self, messages: list[dict], system: str | None = None, max_tokens: int = 1024) -> str:
        if not self._api_key:
            raise LLMServiceError("Gemini API 키가 설정되지 않았습니다.")

        contents = []
        for m in messages:
            role = "model" if m["role"] == "assistant" else "user"
            content = m["content"]
            if isinstance(content, str):
                contents.append({"role": role, "parts": [{"text": content}]})
            else:
                contents.append({"role": role, "parts": content})

        payload = {
            "contents": contents,
            "generationConfig": {"maxOutputTokens": max_tokens},
        }
        if system:
            payload["systemInstruction"] = {
                "parts": [{"text": system}]
            }

        try:
            resp = await self._client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{self._model}:generateContent",
                params={"key": self._api_key},
                headers={"Content-Type": "application/json"},
                json=payload,
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = _extract_gemini_error(exc.response)
            raise LLMServiceError(detail) from exc
        except httpx.HTTPError as exc:
            raise LLMServiceError("Gemini API에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.") from exc

        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise LLMServiceError("Gemini API가 빈 응답을 반환했습니다.")

        parts = candidates[0].get("content", {}).get("parts", [])
        text_parts = [part.get("text", "") for part in parts if isinstance(part, dict)]
        answer = "".join(text_parts).strip()
        if not answer:
            raise LLMServiceError("Gemini API 응답에서 텍스트를 찾지 못했습니다.")
        return answer

    async def chat_with_image(
        self,
        prompt: str,
        image_base64: str,
        media_type: str = "image/jpeg",
        system: str | None = None,
        max_tokens: int = 1024,
    ) -> str:
        messages = [
            {
                "role": "user",
                "content": [
                    {"inlineData": {"mimeType": media_type, "data": image_base64}},
                    {"text": prompt},
                ],
            }
        ]
        return await self.chat(messages, system=system, max_tokens=max_tokens)


def get_llm() -> LLMProvider:
    if settings.LLM_PROVIDER == "openai":
        return OpenAIProvider()
    if settings.LLM_PROVIDER == "gemini":
        return GeminiProvider()
    return ClaudeProvider()


async def llm_json(messages: list[dict], system: str | None = None, max_tokens: int = 1024) -> dict:
    """LLM 응답을 JSON으로 파싱. 실패시 빈 dict 반환."""
    llm = get_llm()
    raw = await llm.chat(messages, system=system, max_tokens=max_tokens)
    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        return json.loads(raw[start:end])
    except (json.JSONDecodeError, ValueError):
        return {}


def _extract_gemini_error(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return f"Gemini API 호출에 실패했습니다. (HTTP {response.status_code})"

    error = payload.get("error", {})
    status = error.get("status")
    message = error.get("message")

    if status == "RESOURCE_EXHAUSTED":
        return "Gemini API 사용량 한도를 초과했습니다. Google AI Studio에서 quota/billing을 확인한 뒤 다시 시도해 주세요."
    if status == "PERMISSION_DENIED":
        return "Gemini API 권한이 없습니다. API 키와 프로젝트 권한 설정을 확인해 주세요."
    if status == "INVALID_ARGUMENT":
        return f"Gemini API 요청 형식이 올바르지 않습니다: {message or 'invalid argument'}"

    if message:
        return f"Gemini API 오류: {message}"
    return f"Gemini API 호출에 실패했습니다. (HTTP {response.status_code})"
