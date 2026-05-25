"""
AI 기능 — 물품 분류, 개인화 추천, 재활용 코칭, 챗봇
"""
from app.services.llm_service import LLMServiceError, get_llm, llm_json

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
    try:
        llm = get_llm()
        prompt = f"""이 물품 이미지를 분류해주세요. 물품명: {title}
카테고리 목록: {', '.join(ITEM_CATEGORIES)}
JSON으로만 응답: {{"category": "카테고리명", "tags": ["태그1", "태그2", "태그3"], "confidence": 0.9}}"""

        raw = await llm.chat_with_image(prompt, image_base64, media_type)
        import json
        start = raw.find("{")
        result = json.loads(raw[start:raw.rfind("}") + 1])
    except Exception as e:
        print(f"classify_item_with_image failed ({e}). Falling back to text-only classify_item.")
        return await classify_item(title, "이미지 분석 실패로 텍스트 분류를 사용합니다.")

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

    try:
        result = await llm_json([{"role": "user", "content": prompt}])
        ranked = result.get("ranked_ids", [])
    except Exception as e:
        print(f"recommend_items failed ({e}). Returning default ID list.")
        ranked = []
        
    all_ids = [i["id"] for i in items]
    # LLM 결과에 없는 ID는 뒤에 추가
    missing = [i for i in all_ids if i not in ranked]
    return ranked + missing


async def recycle_coaching(recycle_type: str, quantity: int = 1, image_base64: str | None = None) -> dict:
    """재활용 품목 안내 + 포인트 계산"""
    base_points = RECYCLE_POINTS.get(recycle_type, RECYCLE_POINTS["기타"])
    earned = base_points * quantity

    ai = {}
    if image_base64:
        try:
            llm = get_llm()
            prompt = f"""이 재활용 이미지를 분석해주세요. 신고한 품목: {recycle_type}, 수량: {quantity}개
올바르게 분리배출했는지 확인하고 코칭해주세요.
JSON으로만 응답: {{"guide": "안내 메시지", "tips": ["팁1", "팁2"], "verified": true}}"""
            raw = await llm.chat_with_image(prompt, image_base64)
            import json
            start = raw.find("{")
            ai = json.loads(raw[start:raw.rfind("}") + 1])
        except Exception as e:
            print(f"recycle_coaching with image failed ({e}). Falling back to text coaching.")
            ai = {}

    if not ai:
        try:
            prompt = f"""{recycle_type} {quantity}개 분리배출 방법을 안내해주세요.
JSON으로만 응답: {{"guide": "안내 메시지", "tips": ["팁1", "팁2"]}}"""
            ai = await llm_json([{"role": "user", "content": prompt}])
        except Exception as e:
            print(f"recycle_coaching with text failed ({e}). Using mock heuristic coaching.")
            ai = {}

    # Heuristic fallback if both fail or if JSON is empty/invalid
    if not ai or not ai.get("guide"):
        guides = {
            "페트병": "페트병은 라벨을 깨끗이 제거하고 물로 헹군 후, 압착하여 페트병 전용 수거함에 배출해주세요.",
            "캔": "철캔이나 알루미늄캔은 내용물을 비우고 물로 헹군 다음, 가능한 압착하여 캔 전용 수거함에 배출해주세요.",
            "종이": "종이상자는 테이프, 택배 송장 등을 완전히 제거한 후 펼쳐서 배출해주세요. 책이나 노트의 스프링도 제거해야 합니다.",
            "유리병": "유리병 뚜껑을 제거하고 속을 깨끗이 비운 후 배출해주세요. 깨진 유리는 종량제 봉투에 안전하게 싸서 버리셔야 합니다.",
            "플라스틱": "플라스틱 용기 안의 이물질을 깨끗이 씻어내고 라벨을 제거한 후 플라스틱 전용 수거함에 분리배출해 주세요.",
            "스티로폼": "음식물 등 이물질이 묻지 않은 흰색 스티로폼만 재활용이 가능합니다. 테이프를 떼고 깨끗한 상태로 배출해 주세요.",
            "전자기기": "소형 가전제품은 주민센터나 지정된 전용 수거함에 배출하시고, 대형 가전제품은 무상 방문수거 서비스를 이용해 배출하세요.",
            "기타": "재질별 분리배출 가이드라인에 따라 철저히 분리수거를 진행해 주시기 바랍니다."
        }
        tips = {
            "페트병": ["투명 페트병은 유색 페트병과 별도로 분리 배출하면 고품질 재활용이 가능합니다.", "뚜껑은 닫아서 배출해도 함께 재활용 과정에서 분리됩니다."],
            "캔": ["부탄가스 캔이나 부탄가스 용기는 반드시 구멍을 뚫어 가스를 완전히 빼낸 후 배출하세요.", "캔 내부 담배꽁초 등 이물질을 넣지 마세요."],
            "종이": ["물에 젖지 않도록 주의하고, 오염된 종이(피자 상자 안쪽 등)는 일반 종량제 봉투에 배출하세요.", "종이팩(우유팩)은 일반 종이류와 별도로 종이팩 전용 수거함에 분리배출하세요."],
            "유리병": ["소주병, 맥주병 등 빈용기보증금 대상 병은 대형마트나 편의점에 반환하고 보증금을 환급받으세요.", "거울, 도자기, 내열유리 식기는 재활용이 불가능하므로 불연성 쓰레기 봉투에 버리셔야 합니다."],
            "플라스틱": ["완구류나 필기구 등 여러 재질이 섞인 복합 플라스틱 제품은 일반 쓰레기로 분류될 수 있습니다.", "펌핑식 용기의 스프링은 철재이므로 분리해서 일반 쓰레기로 버리세요."],
            "스티로폼": ["컵라면 용기 등 오염된 스티로폼은 재활용이 되지 않으므로 씻기지 않는 오염이 있다면 종량제 봉투에 배출하세요.", "과일 포장용 스티로폼 완충재도 분리배출이 가능합니다."],
            "전자기기": ["휴대폰 등 개인정보가 포함된 기기는 공장 초기화 후 배출해 주세요.", "배터리가 내장된 소형 가전은 화재 위험이 있으므로 전용 수거함에 꼭 넣어주세요."],
            "기타": ["혼합 재질의 물품은 가급적 분리하여 배출하고, 분리가 어려운 경우 일반 쓰레기로 배출하세요.", "재활용 표시 마크가 있는지 항상 확인하는 습관을 들이세요."]
        }
        
        matched_type = "기타"
        for k in guides.keys():
            if k in recycle_type:
                matched_type = k
                break
                
        ai = {
            "guide": guides[matched_type],
            "tips": tips[matched_type],
            "verified": True
        }

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
    
    try:
        llm = get_llm()
        return await llm.chat(messages, system=system, max_tokens=2048)
    except LLMServiceError:
        raise
    except Exception as e:
        print(f"chat_with_bot failed ({e}).")
        raise LLMServiceError("Gemini 응답 생성 중 문제가 발생했습니다. 서버 로그를 확인해 주세요.") from e


async def generate_sharing_copy(message: str) -> dict:
    """나눔 등록용 문장을 분석해 폼 입력값을 생성"""
    prompt = f"""사용자가 나눔 등록을 위해 설명한 문장을 읽고, 등록 폼에 넣을 값을 JSON으로만 생성하세요.

사용자 입력:
{message}

규칙:
- category는 반드시 다음 중 하나만 사용: 전자기기, 도서, 생활용품, 의류, 기타
- title은 10~30자 정도의 자연스러운 물품명
- desc는 한 줄 특징으로 15~45자
- report_desc는 사용감/구성품/흠집 등 특이사항 요약. 없으면 "상태 양호"
- explain은 구매 시기, 사용 상태, 나눔 이유를 반영한 2~4문장 한국어 설명
- terminal_id는 반드시 "1"을 사용
- 출력은 JSON만

예시 형식:
{{"title":"무선 블루투스 이어폰","category":"전자기기","desc":"노이즈 캔슬링이 잘 되고 배터리 상태가 좋은 이어폰","report_desc":"충전 케이스 미세 사용감 있음","explain":"...","terminal_id":"123"}}"""

    result = await llm_json([{"role": "user", "content": prompt}], max_tokens=1200)
    required_keys = ["title", "category", "desc", "report_desc", "explain", "terminal_id"]
    if not result or any(not result.get(key) for key in required_keys):
        raise LLMServiceError("Gemini 응답을 등록 폼 형식으로 해석하지 못했습니다. 입력 문장을 조금 더 구체적으로 적어 주세요.")

    category = result.get("category", "기타")
    if category not in {"전자기기", "도서", "생활용품", "의류", "기타"}:
        category = "기타"

    terminal_id = "1"

    return {
        "title": str(result.get("title", "")).strip(),
        "category": category,
        "desc": str(result.get("desc", "")).strip(),
        "report_desc": str(result.get("report_desc", "상태 양호")).strip(),
        "explain": str(result.get("explain", "")).strip(),
        "terminal_id": terminal_id,
    }
