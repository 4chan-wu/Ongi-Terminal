"""
LLM 추상화 레이어 — LLM_PROVIDER 환경변수로 Claude/OpenAI/Gemini 전환
"""
import json
from abc import ABC, abstractmethod
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
        import httpx
        self._client = httpx.AsyncClient(timeout=30.0)
        self._api_key = settings.GEMINI_API_KEY
        self._model = settings.LLM_MODEL_GEMINI

    async def chat(self, messages: list[dict], system: str | None = None, max_tokens: int = 1024) -> str:
        contents = []
        if system:
            contents.append({"role": "user", "parts": [{"text": system}]})
            contents.append({"role": "model", "parts": [{"text": "네, 이해했습니다."}]})
        for m in messages:
            role = "model" if m["role"] == "assistant" else "user"
            content = m["content"]
            if isinstance(content, str):
                contents.append({"role": role, "parts": [{"text": content}]})
            else:
                contents.append({"role": role, "parts": content})

        resp = await self._client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{self._model}:generateContent",
            params={"key": self._api_key},
            headers={"Content-Type": "application/json"},
            json={
                "contents": contents,
                "generationConfig": {"maxOutputTokens": max_tokens},
            },
        )
        resp.raise_for_status()
        return resp.json()["candidates"][0]["content"]["parts"][0]["text"]

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
                    {"inline_data": {"mime_type": media_type, "data": image_base64}},
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