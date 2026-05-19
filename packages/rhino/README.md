# packages/rhino — Phase 2 STUB

**상태: 미구현 (placeholder)**

## 책임 (Phase 2)

`packages/geometry` 의 출력(shapely/GeoJSON)을 입력받아 Rhino로 전송.

## 전송 방식 (옵션, 단계적)

1. **`.3dm` 파일 export** — `rhino3dm` Python 라이브러리로 헤드리스 변환 (1차).
2. **Rhino.Compute REST 호출** — Grasshopper 정의 자동 실행이 필요할 때.
3. **로컬 Rhino 소켓 브릿지** — 실시간 라이브 연동이 필요할 때.

## 기술 스택 (예정)

- Python 3.12
- `rhino3dm` (헤드리스 .3dm 생성)
- 필요 시 `compute-rhino3d` (Rhino.Compute 클라이언트)

## 사용 방식 (예정)

```python
from rhino import export_3dm
from geometry import build_station_points

geom = build_station_points(measurements, stations)
export_3dm(geom, output="output/han_river_water_quality.3dm")
```
