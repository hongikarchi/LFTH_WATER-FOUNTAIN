# 시스템 아키텍처

`docs/dashboard.html` §1~§3의 텍스트 미러. GitHub에서 그대로 Mermaid 렌더링 됨.

## 1. 시스템 다이어그램 (Phase 1: 점선 = Phase 2 계획)

```mermaid
flowchart LR
    User[사용자 브라우저]
    Web["apps/web<br/>(React SPA)"]
    Vite["Vite dev proxy<br/>(localhost:5173)"]
    Api["apps/api<br/>(FastAPI)<br/><i>Phase 2</i>"]
    Cache[(메모리/SQLite 캐시<br/><i>Phase 2</i>)]
    Seoul["Seoul Open API<br/>openapi.seoul.go.kr:8088"]
    Stations["shared/stations.json"]
    Geom["packages/geometry<br/>(Python: shapely)<br/><i>Phase 2</i>"]
    Rhino["packages/rhino<br/>(Python: rhino3dm)<br/><i>Phase 2</i>"]

    User --> Web
    Web -->|"GET /api/json/WPOSInformationTime/1/N/"| Vite
    Vite -->|"key inject + rewrite"| Seoul
    Web -.->|Phase 2| Api
    Api -.-> Cache
    Api -.-> Seoul
    Web -.-> Stations
    Api -.-> Stations
    Api -.-> Geom
    Geom -.-> Rhino
```

## 2. 데이터 파이프라인 (시퀀스)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Comp as Component
    participant Hook as useWaterQuality
    participant Api as fetchWaterQuality
    participant Proxy as Vite proxy
    participant Seoul as Seoul Open API
    participant Norm as normalizeRows
    participant Grade as compositeGrade

    User->>Comp: mount
    Comp->>Hook: useWaterQuality()
    Hook->>Api: fetchWaterQuality(500)
    Api->>Proxy: GET /api/json/.../1/500/
    Proxy->>Seoul: GET /{KEY}/json/.../1/500/
    Seoul-->>Proxy: JSON (500 rows)
    Proxy-->>Api: JSON
    Api-->>Hook: RawResponse
    Hook->>Norm: normalizeRows(raw)
    Norm-->>Hook: NormalizedRow[] (점검중→null, KST parse)
    Hook-->>Comp: { rows, isLoading, lastUpdated, error, refetch }
    Comp->>Grade: compositeGrade(row) per station
    Grade-->>Comp: Grade | 'unmeasurable'
    Comp->>User: render (Cards + Table + Chart)
    Note over Hook: 5분 setInterval 폴링
```

## 3. 모듈 책임

```mermaid
graph LR
    web["apps/web<br/>(IMPLEMENTED)"]
    api["apps/api<br/>(STUB)"]
    geom["packages/geometry<br/>(STUB)"]
    rhino["packages/rhino<br/>(STUB)"]
    shared["shared/<br/>(IMPLEMENTED)"]

    web --> shared
    api -.-> shared
    api -.-> geom
    geom -.-> shared
    rhino -.-> geom
```

| 모듈 | 책임 | 상태 | 언어 | 의존성 |
|------|------|------|------|--------|
| `apps/web` | React SPA: 시각화 (Cards, Table, Chart). 정규화·등급 계산은 클라이언트 lib에서 | Implemented | TypeScript + Vite | shared/ (Phase 2부터 apps/api) |
| `apps/web/src/types/` | 도메인 타입 (Measurements, NormalizedRow, Grade) — React 비의존 | Implemented | TypeScript | — |
| `apps/web/src/lib/` | 순수 함수 (api, normalize, grade) — React 비의존, Phase 2 백엔드 재사용 가능 | Implemented | TypeScript | — |
| `apps/web/src/hooks/` | useWaterQuality (5분 폴링 + refetch) | Implemented | TypeScript + React | lib/ |
| `apps/web/src/components/` | Header, LatestTable, TimeSeriesChart, StationGradeCards | Implemented | TypeScript + React + Recharts | types/, lib/ |
| `apps/api` | FastAPI: Open API 호출 + 캐싱 + REST 엔드포인트. Vite 프록시 대체 | **Stub** | Python | shared/ |
| `packages/geometry` | shapely/geopandas: 측정값 + 좌표 → geometry | **Stub** | Python | shared/ |
| `packages/rhino` | rhino3dm / Rhino.Compute: geometry → .3dm | **Stub** | Python | packages/geometry |
| `shared/` | 언어 중립 자산. 현재 `stations.json` (측정소 메타) | Implemented | JSON | — |
