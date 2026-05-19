# apps/api — Phase 2 STUB

**상태: 미구현 (placeholder)**

## 책임 (Phase 2)

- 서울시 Open API 호출 + 캐싱
- REST 엔드포인트 노출
  - `GET /measurements/latest` — 측정소별 최신값
  - `GET /measurements/history?from=&to=&station=` — 기간 조회
  - `GET /geometry/latest` — `packages/geometry` 결과 (Phase 2.5)
- Vite dev-server 프록시를 production 환경에서 대체

## 기술 스택 (예정)

- Python 3.12 + FastAPI
- `httpx` (Open API 비동기 호출)
- 메모리 캐시 또는 SQLite (시간단위 데이터라 캐시 TTL = 1시간)
- 정규화는 `apps/web`의 `lib/normalize.ts` 규칙을 1:1 포팅

## 시작 방법 (예정)

Phase 2 진입 시 이 폴더에 `pyproject.toml` 추가하고 FastAPI 앱 작성.
