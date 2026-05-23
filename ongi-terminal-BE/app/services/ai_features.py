"""
AI 기능 — 물품 분류, 개인화 추천, 재활용 코칭, 챗봇
"""
from app.services.llm_service import get_llm, llm_json

ITEM_CATEGORIES = [
    "의류/패션", "가전제품", "가구/인테리어", "도서/음반", "스포츠/레저",
    "유아동", "식품/건강", "뷰티/미용", "문구/사무", "기타",
]

RECYCLE_POINTS = {
    "페트병": 10, "캔": 8, "종이": 5, "유리병": 12,
    "플라스틱": 7, "스티로폼": 6, "전자기기": 20, "기타": 3,
}


async def classify_item(title: str, description: str | None) -> dict:
    """물품 텍스트 → 카테고리 + 태그 반환"""
    desc_text = f"\n설명: {description}" if description else ""
    prompt = f"""다음 물품을 분류해주세요.
물품명: {title}{desc_text}

카테고리 목록: {', '.join(ITEM_CATEGORIES)}

JSON으로만 응답하세요:
{{"category": "카테고리명", "tags": ["태그1", "태그2", "태그3"], "confidence": 0.9}}"""

    result = await llm_json([{"role": "user", "content": prompt}])
    return {
        "category": result.get("category", "기타"),
        "tags": result.get("tags", []),
        "confidence": result.get("confidence", 0.5),
    }


async def classify_item_with_image(title: str, image_base64: str, media_type: str = "image/jpeg") -> dict:
    """이미지 + 물품명 → 카테고리 + 태그"""
    llm = get_llm()
    prompt = f"""이 물품 이미지를 분류해주세요. 물품명: {title}
카테고리 목록: {', '.join(ITEM_CATEGORIES)}
JSON으로만 응답: {{"category": "카테고리명", "tags": ["태그1", "태그2", "태그3"], "confidence": 0.9}}"""

    raw = await llm.chat_with_image(prompt, image_base64, media_type)
    try:
        import json
        start = raw.find("{")
        result = json.loads(raw[start:raw.rfind("}") + 1])
    except Exception:
        result = {}
    return {
        "category": result.get("category", "기타"),
        "tags": result.get("tags", []),
        "confidence": result.get("confidence", 0.5),
    }


async def recommend_items(user_interests: list[str], items: list[dict]) -> list[int]:
    """사용자 관심사 기반으로 물품 ID 목록 정렬 반환"""
    if not items:
        return []
    if not user_interests:
        return [i["id"] for i in items]

    items_text = "\n".join(
        f"- id:{i['id']} 제목:{i['title']} 카테고리:{i.get('category','?')} 태그:{i.get('tags','')}"
        for i in items
    )
    prompt = f"""사용자 관심사: {', '.join(user_interests)}

나눔 물품 목록:
{items_text}

관련성이 높은 순서로 물품 id 목록을 JSON으로만 응답하세요:
{{"ranked_ids": [1, 2, 3]}}"""

    result = await llm_json([{"role": "user", "content": prompt}])
    ranked = result.get("ranked_ids", [])
    all_ids = [i["id"] for i in items]
    # LLM 결과에 없는 ID는 뒤에 추가
    missing = [i for i in all_ids if i not in ranked]
    return ranked + missing


async def recycle_coaching(recycle_type: str, quantity: int = 1, image_base64: str | None = None) -> dict:
    """재활용 품목 안내 + 포인트 계산"""
    base_points = RECYCLE_POINTS.get(recycle_type, RECYCLE_POINTS["기타"])
    earned = base_points * quantity

    if image_base64:
        llm = get_llm()
        prompt = f"""이 재활용 이미지를 분석해주세요. 신고한 품목: {recycle_type}, 수량: {quantity}개
올바르게 분리배출했는지 확인하고 코칭해주세요.
JSON으로만 응답: {{"guide": "안내 메시지", "tips": ["팁1", "팁2"], "verified": true}}"""
        raw = await llm.chat_with_image(prompt, image_base64)
        try:
            import json
            start = raw.find("{")
            ai = json.loads(raw[start:raw.rfind("}") + 1])
        except Exception:
            ai = {}
    else:
        prompt = f"""{recycle_type} {quantity}개 분리배출 방법을 안내해주세요.
JSON으로만 응답: {{"guide": "안내 메시지", "tips": ["팁1", "팁2"]}}"""
        ai = await llm_json([{"role": "user", "content": prompt}])

    return {
        "guide": ai.get("guide", f"{recycle_type} 분리배출에 감사합니다."),
        "point_earned": earned,
        "category": recycle_type,
        "tips": ai.get("tips", []),
    }


async def chat_with_bot(message: str, history: list[dict] | None = None) -> str:
    """온기 터미널 AI 챗봇"""
    system = """당신은 온기 터미널의 친절한 AI 어시스턴트입니다.
온기 터미널은 물건 나눔과 재활용을 통해 지역 자원을 순환하는 플랫폼입니다.
물건 나눔, 재활용 방법, 포인트/온기지수, 서비스 이용 방법에 대해 안내해주세요.
한국어로 친근하게 답변하세요."""
    messages = list(history or [])
    messages.append({"role": "user", "content": message})
    llm = get_llm()
    return await llm.chat(messages, system=system, max_tokens=512)
