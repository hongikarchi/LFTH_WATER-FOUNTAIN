# apps/api — FastAPI backend (Phase 2 slice 1)

서울 한강 수질 Open API를 호출·정규화하여 REST 엔드포인트로 제공한다.
Phase 1의 Vite dev proxy를 대체해 production 배포가 가능해진다.

## 스택

- Python 3.12+ (개발 환경: 3.14.4 확인)
- FastAPI + uvicorn[standard]
- httpx (비동기 HTTP 클라이언트)
- pydantic v2 + pydantic-settings (env 로딩)
- uv (패키지 매니저)

## 실행

```powershell
cd "C:\Users\user\Documents\LFTH_WATER FOUNTAIN\apps\api"

# 첫 실행 시 — 의존성 동기화
uv sync

# dev 서버 (자동 리로드)
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

기본 주소: http://127.0.0.1:8000

## 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/healthz` | 헬스체크 |
| GET | `/measurements/latest` | 측정소 4곳의 최신값 1건씩 (정규화 완료) |
| GET | `/measurements/history?limit=500` | 페치한 정규화 row 시간순 정렬 (1~1000) |

OpenAPI / Swagger UI: http://127.0.0.1:8000/docs

## 환경변수 (`.env`)

```
SEOUL_API_KEY=발급받은_키
CORS_ORIGINS=http://localhost:5173
HOST=127.0.0.1
PORT=8000
```

`apps/web` dev server(`localhost:5173`)는 CORS 기본 허용.

## 구조

```
apps/api/
├── pyproject.toml
├── .env                  # gitignored
├── .env.example
├── README.md
└── app/
    ├── __init__.py
    ├── main.py           # FastAPI app + CORS + router mount
    ├── settings.py       # pydantic-settings로 .env 로드
    ├── models.py         # Measurements / NormalizedRow (TS 타입과 1:1)
    ├── seoul_api.py      # httpx 호출 + normalize (점검중→null, KST)
    └── routes/
        └── measurements.py
```

## TS와의 대응

apps/api 모듈은 apps/web의 같은 이름 모듈과 1:1 대응한다:

| Python | TypeScript | 비고 |
|--------|------------|------|
| `app/models.py:Measurements` | `src/types/waterQuality.ts:Measurements` | 키 이름 동일 (`doO2`, `totalN` 등) |
| `app/seoul_api.py:parse_numeric` | `src/lib/normalize.ts:parseNumeric` | `"점검중"` → None/null |
| `app/seoul_api.py:parse_timestamp` | `src/lib/normalize.ts:parseTimestamp` | KST 명시 |
| `app/seoul_api.py:normalize_rows` | `src/lib/normalize.ts:normalizeRows` | 시간순 정렬 |
| `app/seoul_api.py:latest_per_station` | `src/lib/normalize.ts:latestPerStation` | |

JSON 직렬화 시 `NormalizedRow.timestamp`는 ISO 8601 (예: `"2026-05-19T09:00:00+09:00"`) — JS `new Date(...)`가 그대로 파싱.

## Phase 2 후속

- 메모리/SQLite 캐싱 (1시간 TTL — 데이터가 시간 단위)
- `apps/web`의 `lib/api.ts` 가 `/api/measurements/latest` 를 호출하도록 마이그레이션
- 등급 계산을 backend로 이동(옵션) — `lib/grade.ts` 의 Python 포트
