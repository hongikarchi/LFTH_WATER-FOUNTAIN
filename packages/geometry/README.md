# packages/geometry — Phase 2 STUB

**상태: 미구현 (placeholder)**

## 책임 (Phase 2)

`apps/api`로부터 정규화된 수질 측정값 + `shared/stations.json` 좌표를 입력받아 geometry 객체 산출.

예상 출력:
- 측정소 포인트 (수질 등급에 따른 색상/속성)
- 한강 본류/지천 폴리라인
- 측정소 영향권/배수구역 폴리곤 (옵션)
- 시간축에 따른 geometry 시계열

## 기술 스택 (예정)

- Python 3.12
- `shapely` (geometry 연산)
- `geopandas` (공간 데이터프레임)
- `pyproj` (좌표 변환, WGS84 ↔ KATEC/UTM-K)
- 출력 형식: GeoJSON (web 직접 소비) + 중간 객체 (packages/rhino에 전달)

## 사용 방식 (예정)

- `apps/api` 내부에서 라이브러리 import
- CLI로도 단독 실행 가능 (`python -m geometry build --date 2026-05-19`)
