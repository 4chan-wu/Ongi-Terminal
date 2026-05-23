# 온기 터미널 — 백엔드 인수인계 문서

---

## 목차

1. [이 서버가 하는 일](#1-이-서버가-하는-일)
2. [사용 기술과 선택 이유](#2-사용-기술과-선택-이유)
3. [설치 및 최초 실행](#3-설치-및-최초-실행)
4. [폴더 구조](#4-폴더-구조)
5. [핵심 동작 원리](#5-핵심-동작-원리)
6. [전체 기능 흐름 — 시나리오별](#6-전체-기능-흐름--시나리오별)
7. [API 전체 목록](#7-api-전체-목록)
8. [데이터베이스 구조](#8-데이터베이스-구조)
9. [포인트 · 온기지수 계산 방식](#9-포인트--온기지수-계산-방식)
10. [AI 기능 동작 방식](#10-ai-기능-동작-방식)
11. [관리자(어드민) 계정](#11-관리자어드민-계정)
12. [코드 수정할 때](#12-코드-수정할-때)
13. [미구현 기능과 구현 방법](#13-미구현-기능과-구현-방법)
14. [배포할 때 꼭 확인할 것](#14-배포할-때-꼭-확인할-것)
15. [자주 발생하는 오류와 해결법](#15-자주-발생하는-오류와-해결법)

---

## 1. 이 서버가 하는 일

쉽게 말하면, **앱과 데이터베이스 사이의 중간 관리자**입니다.

```
[사용자 앱/웹]
      ↕  HTTP 요청/응답
[이 서버 — 온기 터미널 API]
      ↕  SQL 쿼리
[PostgreSQL 데이터베이스]
      ↕  API 호출
[Claude / ChatGPT (AI)]
```

- 앱이 "물품 등록해줘"라고 요청하면 → 서버가 받아서 AI로 분류하고 → DB에 저장하고 → 결과를 앱에 돌려줍니다.
- 앱이 "QR 찍었어"라고 요청하면 → 서버가 QR 유효성 검증하고 → 물품 상태를 바꾸고 → 포인트를 적립합니다.
- 이 서버 자체는 화면(UI)이 없습니다. 데이터만 처리합니다.

---

## 2. 사용 기술과 선택 이유

백엔드를 처음 접하는 분을 위해, 각 기술이 무엇인지 설명합니다.

### Python
> 서버 코드를 작성한 프로그래밍 언어

AI 라이브러리(Claude, OpenAI SDK)가 Python을 가장 잘 지원하기 때문에 선택했습니다.

### FastAPI
> Python으로 API 서버를 만드는 프레임워크

- **프레임워크**란: 서버 개발에 필요한 기능들을 미리 모아둔 도구 모음입니다.
- FastAPI는 코드를 쓰면 자동으로 **테스트 화면(Swagger UI, `/docs`)** 을 만들어 줍니다. 앱 없이도 API를 테스트할 수 있어서 편합니다.
- `async/await` 문법을 사용해 요청을 비동기로 처리합니다. 쉽게 말해 여러 사용자 요청을 동시에 효율적으로 처리할 수 있습니다.

### PostgreSQL
> 데이터베이스 (데이터를 저장하는 창고)

- 회원 정보, 물품, 포인트 내역 등 모든 데이터가 여기 저장됩니다.
- 엑셀의 여러 시트처럼 테이블로 구분되어 있습니다.

### SQLAlchemy (ORM)
> Python 코드로 데이터베이스를 다루게 해주는 도구

- **ORM**이란: SQL 쿼리(`SELECT * FROM users...`) 대신 Python 코드로 DB를 조작할 수 있게 해주는 번역기입니다.
- 예: `db.execute(select(User).where(User.email == "abc@test.com"))` → 내부적으로 SQL로 변환해서 실행

### Alembic
> 데이터베이스 구조 변경을 관리하는 도구

- 테이블 구조를 바꿀 때 기록을 남겨두고, 언제든 이전 상태로 되돌릴 수 있게 합니다.
- Git의 버전 관리와 비슷한 개념입니다.

### JWT (JSON Web Token)
> 로그인 상태를 증명하는 암호화된 티켓

- 로그인하면 서버가 **access_token**을 발급합니다.
- 이후 요청할 때 이 토큰을 같이 보내면 서버가 "이 사람은 로그인한 사람"임을 확인합니다.
- 토큰에는 유효기간이 있습니다(기본 60분). 만료되면 refresh_token으로 새로 발급받아야 합니다.

### Claude / OpenAI SDK
> AI 기능을 사용하기 위한 도구

- 물품 분류, 재활용 코칭, 추천, 챗봇 등 AI 기능에 사용됩니다.
- 코드 수정 없이 `.env` 파일에서 `LLM_PROVIDER` 값만 바꾸면 Claude ↔ ChatGPT 전환이 됩니다.

### qrcode 라이브러리
> QR 코드 이미지를 Python으로 생성하는 도구

- QR 발급 시 서버가 직접 QR 이미지를 만들어서 base64(텍스트 형태) 로 앱에 전달합니다.

---

## 3. 설치 및 최초 실행

### 3-1. 필수 설치

**Python 3.12**

1. https://www.python.org/downloads/ → Python 3.12 다운로드
2. 설치 화면에서 **"Add Python to PATH"** 반드시 체크
3. 설치 완료 확인:
   ```
   python --version
   ```
   → `Python 3.12.x` 출력되면 OK

**PostgreSQL 16**

1. https://www.postgresql.org/download/ 다운로드
2. 설치 중 **postgres 계정 비밀번호** 설정 — 기억해두기
3. 설치 완료 후 **pgAdmin** (같이 설치됨) 실행
4. 왼쪽 트리에서 `Servers → PostgreSQL 16 → Databases` 우클릭 → `Create → Database`
5. Database name: `ongi_terminal` 입력 후 저장
6. `ongi` 라는 유저도 만들어야 합니다. pgAdmin에서 `Login/Group Roles` 우클릭 → Create → Login/Group Role
   - Name: `ongi`
   - Password 탭: `password` 입력 (또는 원하는 비밀번호, .env에 맞춰 수정)
   - Privileges 탭: `Can login?` ON

**LLM API 키 (둘 중 하나)**

- Claude: https://console.anthropic.com → API Keys → Create Key
- ChatGPT: https://platform.openai.com/api-keys → Create new secret key

### 3-2. 프로젝트 설정

터미널(Windows: PowerShell 또는 명령 프롬프트)을 열고:

```bash
# 이 폴더로 이동
cd "C:\Users\kevin\OneDrive\Desktop\두유콘"

# 라이브러리 설치 (requirements.txt에 있는 것들 자동 설치)
pip install -r requirements.txt
```

### 3-3. 환경변수 파일 만들기

`.env.example` 파일을 복사합니다:

```bash
copy .env.example .env
```

`.env` 파일을 메모장으로 열고 수정:

```env
# ─── 데이터베이스 ───────────────────────────────────────────
# ongi:password 부분에서 password를 PostgreSQL 설치 때 설정한 비밀번호로 교체
DATABASE_URL=postgresql+asyncpg://ongi:password@localhost:5432/ongi_terminal

# ─── 보안 ────────────────────────────────────────────────────
# 아무 랜덤 문자열로 바꾸세요. 절대 공개하면 안 됩니다.
# 예: python -c "import secrets; print(secrets.token_hex(32))" 로 생성 가능
SECRET_KEY=여기를바꾸세요

# ─── AI ──────────────────────────────────────────────────────
LLM_PROVIDER=claude          # claude 또는 openai
ANTHROPIC_API_KEY=sk-ant-...  # Claude 쓸 때
OPENAI_API_KEY=sk-...          # ChatGPT 쓸 때
```

### 3-4. 데이터베이스 테이블 생성

```bash
# 1. 현재 모델 기준으로 마이그레이션 파일 생성
alembic revision --autogenerate -m "initial"

# 2. DB에 실제로 테이블 생성
alembic upgrade head
```

> 성공하면 pgAdmin에서 `ongi_terminal → Schemas → Tables` 에 테이블 목록이 생깁니다.

### 3-5. 서버 실행

```bash
uvicorn app.main:app --reload
```

터미널에 아래가 뜨면 성공:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

브라우저에서 http://localhost:8000/docs 열면 API 테스트 화면이 나옵니다.

---

## 4. 폴더 구조

```
두유콘/
│
├── app/                         ← 서버 코드 전체
│   ├── main.py                  ← 서버 시작점. 모든 라우터를 여기서 연결
│   ├── config.py                ← .env 파일 읽기. 설정값은 여기서 가져옴
│   ├── database.py              ← DB 연결 설정. 세션(DB 접속) 관리
│   │
│   ├── core/                    ← 공통 핵심 기능
│   │   ├── security.py          ← 비밀번호 암호화, JWT 토큰 생성/검증
│   │   └── deps.py              ← "현재 로그인한 유저 가져오기" 등 의존성
│   │
│   ├── models/                  ← DB 테이블 정의 (테이블 1개 = 파일 1개)
│   │   ├── user.py              ← users, user_interests 테이블
│   │   ├── item.py              ← items 테이블
│   │   ├── terminal.py          ← terminals 테이블
│   │   ├── qr_token.py          ← qr_tokens 테이블
│   │   ├── transaction.py       ← item_transactions 테이블
│   │   ├── recycle.py           ← recycle_records 테이블
│   │   ├── point.py             ← point_transactions 테이블
│   │   ├── reward.py            ← rewards, reward_exchanges 테이블
│   │   └── warmth_message.py    ← warmth_messages 테이블
│   │
│   ├── schemas/                 ← API 요청/응답 형식 정의
│   │   ├── user.py              ← 회원가입 입력값, 응답 형식 등
│   │   ├── item.py
│   │   ├── qr.py
│   │   ├── recycle.py
│   │   ├── point.py
│   │   ├── reward.py
│   │   └── terminal.py
│   │
│   ├── routers/                 ← API 엔드포인트 (URL 주소 = 파일 1개)
│   │   ├── auth.py              ← /auth/register, /auth/login, /auth/refresh
│   │   ├── users.py             ← /users/me, /users/me/interests
│   │   ├── terminals.py         ← /terminals
│   │   ├── items.py             ← /items
│   │   ├── qr.py                ← /qr/generate/*, /qr/verify
│   │   ├── recycle.py           ← /recycle/checkin, /recycle/records
│   │   ├── points.py            ← /points/balance, /points/history
│   │   ├── rewards.py           ← /rewards, /rewards/exchange
│   │   └── ai.py                ← /ai/classify, /ai/recommend, /ai/chat
│   │
│   └── services/                ← 핵심 비즈니스 로직
│       ├── llm_service.py       ← Claude/OpenAI 추상화. 여기만 수정하면 AI 교체 가능
│       ├── ai_features.py       ← AI 기능 구현 (분류, 추천, 코칭, 챗봇)
│       ├── qr_service.py        ← QR 생성/검증 로직
│       └── point_service.py     ← 포인트 적립/차감 + 온기지수 연동
│
├── alembic/                     ← DB 마이그레이션 관리
│   ├── env.py                   ← Alembic 설정 (건드리지 않아도 됨)
│   └── versions/                ← 마이그레이션 파일들 (자동 생성됨)
│
├── uploads/                     ← 업로드된 이미지 저장 (자동 생성)
├── .env                         ← 비밀 설정값 ⚠️ Git에 절대 올리면 안 됨
├── .env.example                 ← .env 양식 (Git에 올려도 됨)
├── alembic.ini                  ← Alembic 설정 파일
├── requirements.txt             ← 필요한 라이브러리 목록
├── docker-compose.yml           ← Docker로 실행 시 사용
└── Dockerfile                   ← 서버 컨테이너 빌드 설정
```

### 코드 수정 시 어느 파일을 봐야 하는지

| 하고 싶은 것 | 수정할 파일 |
|---|---|
| 새 API 주소 추가 | `app/routers/` 해당 파일 |
| DB 테이블 구조 변경 | `app/models/` 해당 파일 → alembic 마이그레이션 |
| API 요청/응답 형식 변경 | `app/schemas/` 해당 파일 |
| AI 프롬프트 수정 | `app/services/ai_features.py` |
| AI 제공사 교체 | `.env`의 `LLM_PROVIDER` 변경 |
| 포인트 지급량 변경 | `app/services/ai_features.py` 상단 `RECYCLE_POINTS` 딕셔너리, `app/routers/items.py`·`qr.py` 내 `earn_points()` 호출부 |
| 토큰 만료 시간 변경 | `.env`의 `ACCESS_TOKEN_EXPIRE_MINUTES` |

---

## 5. 핵심 동작 원리

### 요청이 처리되는 흐름

앱이 서버에 요청을 보낼 때 내부에서 일어나는 일:

```
앱 → POST /items (물품 등록 요청)
        ↓
  1. main.py: 어느 라우터가 처리할지 결정
        ↓
  2. routers/items.py: 요청 받아서 처리 시작
        ↓
  3. core/deps.py: JWT 토큰 검증 → 현재 유저 확인
        ↓
  4. services/ai_features.py: Claude에 물품 분류 요청
        ↓
  5. models/item.py: DB에 저장할 데이터 구조로 변환
        ↓
  6. database.py: PostgreSQL에 INSERT 실행
        ↓
  7. services/point_service.py: 포인트 20pt 적립
        ↓
  8. 결과를 JSON으로 만들어서 앱에 응답
```

### 인증 방식 (JWT)

```
① 로그인 (POST /auth/login)
   → 서버가 access_token + refresh_token 발급
   → 앱이 이 토큰을 기기에 저장

② 이후 요청마다
   → 앱이 요청 헤더에 "Authorization: Bearer [access_token]" 포함
   → 서버가 토큰 검증 → 어느 유저인지 파악

③ access_token 만료 시 (기본 60분)
   → POST /auth/refresh 에 refresh_token 전송
   → 새 access_token 발급
```

### QR 코드 흐름

```
[기증자]                    [서버]                  [수령자]
   |                           |                        |
   | POST /qr/generate/checkin |                        |
   |-------------------------->|                        |
   |   QR 이미지(base64) 수신  |                        |
   |<--------------------------|                        |
   | 터미널에 QR 스캔          |                        |
   |   POST /qr/verify         |                        |
   |-------------------------->|                        |
   |                    item.status = "stored"          |
   |                           |                        |
   |                           |  POST /qr/generate/checkout
   |                           |<-----------------------|
   |                           |   QR 이미지 발급       |
   |                           |----------------------->|
   |                           |  터미널에 QR 스캔      |
   |                           |  POST /qr/verify       |
   |                           |<-----------------------|
   |                    item.status = "taken"           |
   |                    수령자 포인트 +30pt              |
```

---

## 6. 전체 기능 흐름 — 시나리오별

### 시나리오 1: 물품 나눔 (처음부터 끝까지)

1. **회원가입** `POST /auth/register`
   ```json
   { "email": "user@test.com", "nickname": "홍길동", "password": "1234" }
   ```

2. **로그인** `POST /auth/login` → `access_token` 발급

3. **관심사 등록** `POST /users/me/interests`
   ```json
   { "tag_name": "가전제품" }
   ```

4. **물품 등록** `POST /items` (multipart/form-data)
   - `title`: "아이폰 케이스"
   - `description`: "투명 실리콘, 거의 새것"
   - `image`: 사진 파일 (선택)
   - → 서버가 Claude에 분류 요청 → 카테고리/태그 자동 입력 → 포인트 +20

5. **기증자가 터미널에 물건 맡기기** `POST /qr/generate/checkin`
   ```json
   { "item_id": 1, "terminal_id": 3 }
   ```
   → QR 이미지(base64) 수신 → 터미널에 스캔

6. **터미널에서 QR 인식** `POST /qr/verify`
   ```json
   { "token": "uuid-...", "terminal_id": 3 }
   ```
   → 물품 상태 `registered` → `stored` 변경

7. **수령자가 수령 QR 발급** `POST /qr/generate/checkout`
   → 물건 가져갈 때 터미널에 스캔

8. **수령 완료** `POST /qr/verify` → 상태 `stored` → `taken`, 포인트 +30

---

### 시나리오 2: 재활용 참여

1. 로그인 후 `POST /recycle/checkin` (multipart/form-data)
   - `terminal_id`: 3
   - `recycle_type`: "페트병"
   - `quantity`: 5
   - `image`: 사진 (선택)
   
2. → 서버가 Claude에 분류 확인 + 코칭 메시지 요청
3. → 포인트 적립 (10pt × 5개 = 50pt)
4. → 응답으로 코칭 안내 + 적립 포인트 반환

---

## 7. API 전체 목록

> http://localhost:8000/docs 에서 직접 실행 가능

### 인증
| Method | Path | 로그인 필요 | 설명 |
|---|---|---|---|
| POST | /auth/register | ✗ | 회원가입. access/refresh 토큰 반환 |
| POST | /auth/login | ✗ | 로그인. 토큰 반환 |
| POST | /auth/refresh | ✗ | access_token 갱신 |

### 사용자
| Method | Path | 로그인 필요 | 설명 |
|---|---|---|---|
| GET | /users/me | ✅ | 내 정보 조회 |
| PATCH | /users/me | ✅ | 닉네임 수정 |
| GET | /users/me/balance | ✅ | 포인트 잔액 + 온기지수 |
| GET | /users/me/interests | ✅ | 관심사 목록 |
| POST | /users/me/interests | ✅ | 관심사 추가 |
| DELETE | /users/me/interests/{tag} | ✅ | 관심사 삭제 |

### 터미널
| Method | Path | 로그인 필요 | 설명 |
|---|---|---|---|
| GET | /terminals | ✗ | 활성 터미널 전체 목록 |
| GET | /terminals/{id} | ✗ | 터미널 상세 |
| POST | /terminals | 어드민 | 터미널 등록 |
| PATCH | /terminals/{id} | 어드민 | 터미널 정보 수정 |

### 물품
| Method | Path | 로그인 필요 | 설명 |
|---|---|---|---|
| POST | /items | ✅ | 물품 등록. 이미지 첨부 시 AI 자동 분류 |
| GET | /items | ✗ | 목록 조회. `?terminal_id=1`, `?category=가전제품` 필터 가능 |
| GET | /items/{id} | ✗ | 물품 상세 |
| PATCH | /items/{id}/status | ✅ | 물품 상태 변경 (본인 또는 어드민) |
| DELETE | /items/{id} | ✅ | 물품 삭제 (본인 또는 어드민) |

### QR
| Method | Path | 로그인 필요 | 설명 |
|---|---|---|---|
| POST | /qr/generate/checkin | ✅ | 기증자가 물건 맡길 때 QR 발급 |
| POST | /qr/generate/checkout | ✅ | 수령자가 물건 가져갈 때 QR 발급 |
| POST | /qr/verify | ✅ | QR 스캔 처리. 상태 변경 + 포인트 |

### 재활용
| Method | Path | 로그인 필요 | 설명 |
|---|---|---|---|
| POST | /recycle/checkin | ✅ | 재활용 신고. AI 코칭 + 포인트 적립 |
| GET | /recycle/records | ✅ | 내 재활용 기록 목록 |

### 포인트
| Method | Path | 로그인 필요 | 설명 |
|---|---|---|---|
| GET | /points/balance | ✅ | 현재 포인트 잔액 + 온기지수 |
| GET | /points/history | ✅ | 포인트 적립/사용 내역 |

### 리워드
| Method | Path | 로그인 필요 | 설명 |
|---|---|---|---|
| GET | /rewards | ✗ | 교환 가능한 리워드 목록 (재고 있는 것만) |
| POST | /rewards | 어드민 | 리워드 등록 |
| POST | /rewards/exchange | ✅ | 포인트로 리워드 교환 |
| GET | /rewards/exchanges | ✅ | 내 교환 내역 |

### AI
| Method | Path | 로그인 필요 | 설명 |
|---|---|---|---|
| POST | /ai/classify | ✗ | 물품 분류. form-data로 title + 선택적 image |
| GET | /ai/recommend | ✅ | 내 관심사 기반 물품 추천 |
| POST | /ai/chat | ✅ | 서비스 AI 챗봇 |

### 기타
| Method | Path | 설명 |
|---|---|---|
| GET | /health | 서버 상태 확인 |
| GET | /docs | Swagger UI (API 테스트 화면) |

---

### `/docs` 에서 로그인 필요한 API 테스트하는 법

1. `POST /auth/login` 실행 → 응답의 `access_token` 값 복사
2. 화면 오른쪽 상단 **Authorize** 버튼 클릭
3. Value 입력란에 `Bearer ` (띄어쓰기 포함) 뒤에 토큰 붙여넣기
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Authorize 클릭 → 이후 API들이 자동으로 인증됨

---

## 8. 데이터베이스 구조

### 테이블 관계도

```
users ──────────────────────────┐
  │ 1:N                         │
  ├── user_interests             │ (기증자/수령자)
  ├── items (donor_id)           │
  ├── point_transactions         │
  ├── recycle_records            │
  └── reward_exchanges           │
                                 │
terminals ─────────────────┐    │
  │ 1:N                    │    │
  └── items (terminal_id)  │    │
                            │    │
items ──────────────────────┘    │
  │ 1:N                         │
  ├── item_transactions ─────────┘
  ├── qr_tokens
  └── warmth_messages
```

### 물품 상태(status) 흐름

```
registered  →  stored  →  taken
    ↓              ↓
  expired       rejected
```

- `registered`: 등록만 된 상태 (아직 터미널에 없음)
- `stored`: QR 체크인 완료. 터미널에 보관 중
- `taken`: QR 체크아웃 완료. 수령됨
- `expired`: 유효기간 만료
- `rejected`: 관리자가 거부

### QR 타입

| qr_type | 용도 |
|---|---|
| `item_checkin` | 기증자가 터미널에 물건 맡길 때 |
| `item_checkout` | 수령자가 터미널에서 물건 가져갈 때 |
| `recycle_checkin` | 재활용 반납 시 (현재 미사용, 확장용) |

---

## 9. 포인트 · 온기지수 계산 방식

### 포인트 지급 정책

| 행동 | 포인트 |
|---|---|
| 물품 나눔 등록 | +20 pt |
| 물품 수령 (QR 체크아웃) | +30 pt |
| 재활용 반납 — 페트병 | +10 × 수량 |
| 재활용 반납 — 캔 | +8 × 수량 |
| 재활용 반납 — 종이 | +5 × 수량 |
| 재활용 반납 — 유리병 | +12 × 수량 |
| 재활용 반납 — 플라스틱 | +7 × 수량 |
| 재활용 반납 — 스티로폼 | +6 × 수량 |
| 재활용 반납 — 전자기기 | +20 × 수량 |
| 리워드 교환 | -교환 포인트 |

> 포인트 지급량 수정: [app/services/ai_features.py](app/services/ai_features.py) 상단 `RECYCLE_POINTS` 딕셔너리,  
> [app/routers/items.py](app/routers/items.py)와 [app/routers/qr.py](app/routers/qr.py)의 `earn_points()` 호출 부분

### 온기지수 계산

```
온기지수 += 적립 포인트 ÷ 10  (소수점 버림)
```

예: 포인트 100pt 적립 시 온기지수 +10

> 계산 로직: [app/services/point_service.py](app/services/point_service.py)의 `earn_points()` 함수

---

## 10. AI 기능 동작 방식

### LLM 추상화 구조

```
routers/items.py
    ↓ classify_item() 호출
services/ai_features.py
    ↓ llm.chat() 호출
services/llm_service.py
    ├── ClaudeProvider  (LLM_PROVIDER=claude일 때)
    └── OpenAIProvider  (LLM_PROVIDER=openai일 때)
```

AI 제공사를 바꾸려면 `.env`의 `LLM_PROVIDER`만 바꾸면 됩니다. 코드는 그대로입니다.

### AI 기능 별 프롬프트 위치

| 기능 | 코드 위치 |
|---|---|
| 물품 분류 (텍스트) | `ai_features.py` → `classify_item()` |
| 물품 분류 (이미지) | `ai_features.py` → `classify_item_with_image()` |
| 개인화 추천 | `ai_features.py` → `recommend_items()` |
| 재활용 코칭 | `ai_features.py` → `recycle_coaching()` |
| 챗봇 | `ai_features.py` → `chat_with_bot()` — `system` 변수에 인격 정의 |

### 프롬프트 수정 방법

[app/services/ai_features.py](app/services/ai_features.py)를 열면 각 함수 안에 `prompt = """..."""` 형태로 작성되어 있습니다. 이 텍스트를 수정하면 AI 응답이 바뀝니다.

> **주의:** AI 응답은 반드시 JSON 형식으로 오도록 프롬프트에 명시되어 있습니다. 형식을 바꾸면 파싱 오류가 날 수 있습니다.

---

## 11. 관리자(어드민) 계정

어드민 계정만 할 수 있는 것:
- 터미널 등록/수정 (`POST /terminals`, `PATCH /terminals/{id}`)
- 리워드 등록 (`POST /rewards`)

**어드민 권한 부여 방법** — pgAdmin SQL 편집기 또는 터미널에서:

```sql
UPDATE users SET role = 'admin' WHERE email = '관리자이메일@example.com';
```

일반 회원가입 후 이 쿼리를 실행하면 어드민이 됩니다.

---

## 12. 코드 수정할 때

### 서버는 자동으로 재시작됩니다

`--reload` 옵션으로 실행했기 때문에, 파일을 저장하면 서버가 자동 재시작됩니다.

### DB 테이블 구조를 바꿨을 때 (필수)

`app/models/` 안의 파일을 수정했다면 반드시 아래를 실행해야 합니다:

```bash
alembic revision --autogenerate -m "변경 내용 설명"
alembic upgrade head
```

이걸 빠뜨리면 코드와 DB가 달라서 오류가 납니다.

### 새 API 라우터를 추가했을 때

`app/routers/`에 새 파일을 만들었다면, [app/main.py](app/main.py)에 두 줄을 추가해야 합니다:

```python
from app.routers import 새파일이름      # 1. import 추가
app.include_router(새파일이름.router)   # 2. 등록
```

---

## 13. 미구현 기능과 구현 방법

### 터미널 근처 검색 (위치 기반 필터)

**현재:** `/terminals` 는 전체 목록만 반환합니다.  
**목표:** 사용자 위치 기준 반경 N km 이내 터미널만 반환.

[app/routers/terminals.py](app/routers/terminals.py)의 `list_terminals` 함수를 아래처럼 수정하면 됩니다:

```python
import math

def haversine(lat1, lng1, lat2, lng2) -> float:
    """두 좌표 간 거리 계산 (km)"""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))

@router.get("")
async def list_terminals(
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float = 5.0,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Terminal).where(Terminal.status == "active"))
    terminals = result.scalars().all()
    if lat and lng:
        terminals = [
            t for t in terminals
            if t.latitude and t.longitude
            and haversine(lat, lng, float(t.latitude), float(t.longitude)) <= radius_km
        ]
    return terminals
```

---

### 온기 메시지 (감사 메시지)

**현재:** DB 테이블(`warmth_messages`)만 있고 API가 없음.  
**목표:** 수령자가 기증자에게 익명 감사 메시지를 남길 수 있는 기능.

새 파일 `app/routers/messages.py` 생성:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.core.deps import get_current_user
from app.models.warmth_message import WarmthMessage
from pydantic import BaseModel

router = APIRouter(prefix="/items", tags=["messages"])

class MessageIn(BaseModel):
    message: str

@router.post("/{item_id}/messages", status_code=201)
async def send_message(item_id: int, body: MessageIn, db=Depends(get_db), user=Depends(get_current_user)):
    msg = WarmthMessage(item_id=item_id, sender_id=user.id, message=body.message)
    db.add(msg)
    await db.flush()
    return {"id": msg.id, "message": msg.message}

@router.get("/{item_id}/messages")
async def get_messages(item_id: int, db=Depends(get_db)):
    result = await db.execute(select(WarmthMessage).where(WarmthMessage.item_id == item_id))
    return [{"message": m.message, "created_at": m.created_at} for m in result.scalars()]
```

[app/main.py](app/main.py)에 추가:
```python
from app.routers import messages
app.include_router(messages.router)
```

---

### 어드민 통계 API

**목표:** 전체 나눔 건수, 재활용 건수, 포인트 발급량 등 현황 조회.

새 파일 `app/routers/admin.py` 생성:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.core.deps import get_current_admin
from app.models.item import Item
from app.models.recycle import RecycleRecord
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    total_items = (await db.execute(select(func.count(Item.id)))).scalar()
    taken_items = (await db.execute(select(func.count(Item.id)).where(Item.status == "taken"))).scalar()
    total_recycles = (await db.execute(select(func.count(RecycleRecord.id)))).scalar()
    total_points = (await db.execute(select(func.sum(RecycleRecord.point_earned)))).scalar()
    return {
        "total_users": total_users,
        "total_items_registered": total_items,
        "total_items_taken": taken_items,
        "total_recycles": total_recycles,
        "total_points_issued_via_recycle": total_points or 0,
    }
```

[app/main.py](app/main.py)에 추가:
```python
from app.routers import admin
app.include_router(admin.router)
```

---

### 이미지 S3 업로드

**현재:** 이미지가 서버 로컬 폴더(`./uploads/`)에 저장됩니다.  
**문제:** 서버를 재배포하거나 재시작하면 이미지가 사라질 수 있습니다.  
**목표:** AWS S3 (클라우드 스토리지)에 저장해서 영구 보존.

1. `requirements.txt`에 `boto3==1.35.0` 추가 후 `pip install boto3`

2. `.env`에 추가:
   ```env
   STORAGE_BACKEND=s3
   AWS_S3_BUCKET=버킷이름
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=ap-northeast-2
   ```

3. [app/config.py](app/config.py)에 필드 추가:
   ```python
   AWS_S3_BUCKET: str = ""
   AWS_ACCESS_KEY_ID: str = ""
   AWS_SECRET_ACCESS_KEY: str = ""
   AWS_REGION: str = "ap-northeast-2"
   ```

4. [app/routers/items.py](app/routers/items.py)와 [app/routers/recycle.py](app/routers/recycle.py)에서 `open(path, "wb")` 블록을 교체:

   ```python
   # 기존 로컬 저장 코드 (이 부분을 교체)
   # with open(path, "wb") as f:
   #     f.write(content)
   # image_url = f"/uploads/{filename}"

   # S3 저장으로 교체
   import boto3
   s3 = boto3.client(
       "s3",
       aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
       aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
       region_name=settings.AWS_REGION,
   )
   s3.put_object(Bucket=settings.AWS_S3_BUCKET, Key=filename, Body=content, ContentType=media_type)
   image_url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{filename}"
   ```

---

## 14. 배포할 때 꼭 확인할 것

### 반드시 바꿔야 하는 설정

| 항목 | 개발 환경 | 배포 환경 |
|---|---|---|
| `SECRET_KEY` | 아무 문자열 | 32자리 이상 랜덤 문자열로 교체 |
| `DATABASE_URL` | localhost | 실제 DB 서버 주소 |
| `APP_ENV` | development | production |
| `ALLOWED_ORIGINS` | localhost:3000 | 실제 앱/웹 도메인 |
| `LOCAL_UPLOAD_DIR` | ./uploads | S3로 교체 권장 |

### .env 파일은 절대 Git에 올리면 안 됩니다

`.gitignore` 파일에 `.env`가 등록되어 있는지 확인하세요:
```
.env
uploads/
```

### Docker로 배포할 때

```bash
docker-compose up --build -d
```

`-d` 옵션은 백그라운드에서 실행하는 의미입니다.

---

## 15. 자주 발생하는 오류와 해결법

### 서버가 켜지지 않을 때

**오류:** `ModuleNotFoundError: No module named 'fastapi'`
```bash
pip install -r requirements.txt
```

**오류:** `python-jose` 관련 오류
```bash
pip install "python-jose[cryptography]"
```

**오류:** `.env` 관련 오류
→ `.env` 파일이 프로젝트 루트(`두유콘/`)에 있는지 확인

---

### 데이터베이스 오류

**오류:** `relation "users" does not exist` (테이블이 없음)
```bash
alembic upgrade head
```

**오류:** `asyncpg.exceptions.InvalidPasswordError`
→ `.env`의 `DATABASE_URL`에서 비밀번호 확인. PostgreSQL 설치 시 설정한 비밀번호와 일치해야 함

**오류:** `Connection refused` (DB 연결 실패)
→ PostgreSQL 서비스가 실행 중인지 확인
- Windows: 작업 관리자 → 서비스 탭 → `postgresql-x64-16` 실행 중인지 확인

---

### 인증 오류

**오류:** `401 Unauthorized`
→ `/docs`에서 Authorize 버튼으로 토큰을 등록했는지 확인  
→ 토큰 앞에 `Bearer ` (공백 포함) 를 붙였는지 확인  
→ 토큰이 만료된 경우 `/auth/refresh`로 재발급

**오류:** `403 Forbidden`
→ 어드민 전용 API를 일반 유저로 접근한 경우

---

### AI 기능 오류

**오류:** `anthropic.AuthenticationError`
→ `.env`의 `ANTHROPIC_API_KEY` 값 확인. 키 앞뒤 공백 없는지 확인

**오류:** AI 분류 결과가 이상할 때
→ [app/services/ai_features.py](app/services/ai_features.py)의 프롬프트 수정  
→ `LLM_PROVIDER=openai`로 바꿔서 다른 모델로 테스트

---

### 포트 충돌

**오류:** `[Errno 10048] error while attempting to bind on address`
```bash
# 다른 포트로 실행
uvicorn app.main:app --reload --port 8001
```

---

## 빠른 참고

```bash
# 서버 실행
uvicorn app.main:app --reload

# 라이브러리 재설치
pip install -r requirements.txt

# DB 마이그레이션 (모델 변경 후)
alembic revision --autogenerate -m "설명"
alembic upgrade head

# DB 롤백
alembic downgrade -1

# Docker 실행
docker-compose up --build

# 어드민 계정 설정 (pgAdmin SQL 탭에서)
UPDATE users SET role='admin' WHERE email='이메일';

# AI 분류 테스트 (터미널에서)
python -c "
import asyncio
from app.services.ai_features import classify_item
result = asyncio.run(classify_item('아이폰 케이스', '투명 실리콘'))
print(result)
"
```
