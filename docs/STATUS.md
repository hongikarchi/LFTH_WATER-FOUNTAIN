# 프로젝트 현재 상태

> **수동 갱신** — 매 작업 세션 종료 시 갱신.
> 가장 최근 변경된 사실을 위쪽에 추가.

## 갱신 일자

**2026-05-19** — Phase 1.5 완료 (HTML 대시보드 + 수질 등급)

## 마일스톤

| 일자 | Phase | 설명 | commit |
|------|-------|------|--------|
| 2026-05-19 | Phase 1 | MVP 완료 (apps/web), GitHub push | `430d8c3` |
| 2026-05-19 | Phase 1.5 | Dashboard + Grading 완료 | (이번 commit) |

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

### ❌ Known gaps
- **Vite proxy production 격차**: `npm run dev` 에서만 동작. `vite build` 정적 배포 시 CORS로 막힘. Phase 2 `apps/api`로 해소 예정.
- **측정소 좌표 미입력**: `shared/stations.json` 의 `coordinates` 필드가 모두 `null`. Phase 2 시작 시 검증된 출처로 채움.
- **페놀/시안 검출 임계값 거침**: 현재 `value > 0` 규칙. Phase 2에서 별표 1 검출한계로 보정 예정 (ADR-0002).
- **Mermaid 다크 테마 미지원**: `theme: 'default'` 고정 (light only). 사용자 OS 다크모드 무관.

## 개발 실행

```powershell
cd "C:\Users\user\Documents\LFTH_WATER FOUNTAIN\apps\web"
npm run dev
# http://localhost:5173
```

대시보드 보기:
```powershell
# Windows 더블클릭 또는:
start "C:\Users\user\Documents\LFTH_WATER FOUNTAIN\docs\dashboard.html"
```

GitHub Pages로 배포 시: Settings → Pages → Source: `main` branch, `/docs` folder.
