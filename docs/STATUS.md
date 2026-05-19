# 프로젝트 현재 상태

> **수동 갱신** — 매 작업 세션 종료 시 갱신.
> 가장 최근 변경된 사실을 위쪽에 추가.

## 갱신 일자

**2026-05-19** — Phase 2 slice 1 완료 (apps/api FastAPI + stations 좌표 1차)

## 마일스톤

| 일자 | Phase | 설명 | commit |
|------|-------|------|--------|
| 2026-05-19 | Phase 1 | MVP 완료 (apps/web), GitHub push | `430d8c3` |
| 2026-05-19 | Phase 1.5 | Dashboard + Grading 완료 | `1216f4f` |
| 2026-05-19 | Phase 2 slice 1 | apps/api FastAPI 스캐폴드 + `/measurements/{latest,history}` + stations 좌표 1차 | (이번 commit) |

## 진행 상황

### ✅ 완료
- 모노레포 구조 (`apps/`, `packages/`, `shared/`, `docs/`)
- `apps/web` Phase 1 MVP
  - Vite + React + TypeScript 스캐폴드, Recharts
  - Open API 페치 (Vite dev proxy via `/api`)
  - 데이터 정규화 (`점검중` → `null`, KST timestamp)
  - 컴포넌트: Header, LatestTable, TimeSeriesChart
  - 5분 자동 폴링 + 수동 새로고침
  - 빌드 + 린트 통과
- `apps/web` Phase 1.5 수질 등급
  - `lib/grade.ts` — 별표 1 thresholds + gradeFor + compositeGrade(worst-of) + toxicantStatus + boundariesFor + DEV assertions
  - `types/waterQuality.ts` — Grade types + RdYlBu_r 색 팔레트
  - `StationGradeCards` 컴포넌트 — 측정소 4 카드 + 등급 배지 + 독성 pill
  - `LatestTable` — graded 셀에 색 dot
  - `TimeSeriesChart` — graded metric에 `ReferenceLine` 등급 경계
- `docs/dashboard.html` — 7 섹션 자기완결 HTML + Mermaid CDN
- 보조 markdown 6개 (README, architecture, grading, seoul-api, roadmap, STATUS)
- ADR 3개 (`decisions/README.md` + 0001/0002/0003)
- GitHub repo: https://github.com/hongikarchi/LFTH_WATER-FOUNTAIN
- `apps/api` Phase 2 slice 1 (FastAPI 백엔드)
  - uv + FastAPI + httpx + pydantic-settings, Python 3.12
  - `app/models.py` — Measurements / NormalizedRow (TS 타입 1:1)
  - `app/seoul_api.py` — fetch + normalize (점검중→null, HR=24:00 quirk 처리, KST)
  - `app/routes/measurements.py` — `GET /measurements/latest`, `GET /measurements/history?limit=`
  - CORS 헤더 (apps/web `localhost:5173` 허용 확인됨)
  - 실행: `uv run uvicorn app.main:app --reload`
- `shared/stations.json` 좌표 1차 입력 (APPROXIMATE 플래그 + 검증 출처 명시)

### ❌ Known gaps
- **apps/web 미마이그레이션**: 현재 Vite dev proxy 그대로 사용중. `lib/api.ts`를 `/measurements/latest` 호출로 전환하는 작업 미실시 (Phase 2 slice 2).
- **측정소 좌표 APPROXIMATE**: `shared/stations.json` 좌표는 한강 합류부 / 선유도 등 랜드마크 기준 근사값. Phase 2 geometry 진입 전 OA-22264 xlsx로 검증 필요 (해당 파일 자체에 명시됨).
- **백엔드 캐싱 없음**: 매 요청마다 Seoul API 호출. 시간 단위 데이터 → 1h TTL 메모리 캐시 도입 예정.
- **페놀/시안 검출 임계값 거침**: 현재 `value > 0` 규칙. Phase 2에서 별표 1 검출한계로 보정 예정 (ADR-0002).
- **Mermaid 다크 테마 미지원**: `theme: 'default'` 고정 (light only). 사용자 OS 다크모드 무관.

## 개발 실행

**Frontend** (Vite + React):
```powershell
cd "C:\Users\user\Documents\LFTH_WATER FOUNTAIN\apps\web"
npm run dev
# http://localhost:5173
```

**Backend** (FastAPI + uvicorn):
```powershell
cd "C:\Users\user\Documents\LFTH_WATER FOUNTAIN\apps\api"
uv sync                                                # 첫 실행 시
uv run uvicorn app.main:app --reload
# http://127.0.0.1:8000
# Swagger UI: http://127.0.0.1:8000/docs
```

대시보드 보기:
```powershell
# Windows 더블클릭 또는:
start "C:\Users\user\Documents\LFTH_WATER FOUNTAIN\docs\dashboard.html"
```

GitHub Pages로 배포 시: Settings → Pages → Source: `main` branch, `/docs` folder.
