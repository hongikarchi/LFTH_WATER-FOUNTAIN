# LFTH Water Fountain — 한강 수질 실시간 시각화

서울시 한강 수질 자동측정 Open API를 받아 브라우저에서 실시간 시각화하고, 이후 데이터를 geometry로 가공해 Rhino까지 보내는 파이프라인을 단계적으로 구축한다.

## 모노레포 구조

```
.
├── apps/
│   ├── web/         # Phase 1 — Vite + React + TypeScript 시각화 SPA
│   └── api/         # Phase 2 — FastAPI: Open API 프록시 + REST 엔드포인트
├── packages/
│   ├── geometry/    # Phase 2 — Python 라이브러리: 수질 데이터 → shapely/geopandas geometry
│   └── rhino/       # Phase 2 — Python 라이브러리: geometry → Rhino (rhino3dm/.3dm export, Rhino.Compute)
├── shared/          # 언어 중립 공유 자산 (측정소 메타 등)
└── docs/            # 아키텍처/배포/API 문서
```

### 모듈 책임

- **apps/web**: 사용자에게 보여지는 React SPA. Phase 1은 Vite dev 프록시로 Open API 직접 호출, Phase 2는 `apps/api`를 호출하도록 베이스 URL만 교체.
- **apps/api**: Open API 호출 + 캐싱 + REST 노출. Vite 프록시를 대체해 production 배포 가능하게 함.
- **packages/geometry**: 측정값 + `shared/stations.json` 좌표 → shapely/numpy geometry 산출. 순수 Python 라이브러리.
- **packages/rhino**: geometry → Rhino. 1차 `rhino3dm`으로 `.3dm` export, 추후 Rhino.Compute REST.
- **shared/**: `stations.json` 등 web/backend 공통 참조 자산.

## Phase 1 현재 상태

`apps/web/` 만 구현. 나머지 모듈은 README 스텁만 존재.

### 실행
```powershell
cd ".\apps\web"
npm install
npm run dev
```
브라우저에서 `http://localhost:5173` 접속.

## Data Source

- API: 서울시 한강 및 주요지천 수질 측정 자료 (시간단위)
- 엔드포인트: `http://openapi.seoul.go.kr:8088/{KEY}/json/WPOSInformationTime/{START}/{END}/`
- 측정소 4곳: 탄천, 중랑천, 안양천, 선유
- 1회 최대 1,000건, 호출 횟수 제한 없음
- 라이선스: 공공누리 1유형 (출처표시)

## Phase 1 → Production 격차

Vite dev-server 프록시는 `npm run dev` 에서만 동작. `vite build` 정적 배포 시 CORS로 막힘. Phase 2에서 `apps/api` 가 프록시 역할을 대체하면 해결.
