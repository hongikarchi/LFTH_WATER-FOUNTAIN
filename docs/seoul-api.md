# Seoul Open API 사전

## 데이터셋

- 명칭: 서울시 한강 및 주요지천 수질 측정 자료
- 페이지: https://data.seoul.go.kr/dataList/OA-15488/S/1/datasetView.do
- 갱신 주기: 시간 단위
- 라이선스: 공공누리 1유형 (출처표시)
- 운영기관: 서울특별시 보건환경연구원

## 엔드포인트

```
http://openapi.seoul.go.kr:8088/{KEY}/{xml|json}/WPOSInformationTime/{START}/{END}/
```

- `{KEY}`: 발급 인증키
- `{xml|json}`: 응답 형식
- `{START}/{END}`: 1-based row range
- 1회 최대 1,000건, 호출 횟수 제한 없음

이 프로젝트는 `json` 형식을 사용. dev 환경에서는 Vite proxy가 `/api` → `/{KEY}` 로 rewrite (키는 클라이언트 번들에 노출되지 않음).

## 응답 구조

```json
{
  "WPOSInformationTime": {
    "list_total_count": 2914,
    "RESULT": { "CODE": "INFO-000", "MESSAGE": "정상 처리되었습니다" },
    "row": [
      { "YMD": "20260519", "HR": "09:00", "MSRSTN_NM": "탄천", "WATT": "22.1", ... }
    ]
  }
}
```

행 정렬: 관측 결과 **최신 → 과거** (2026-05-19 확인). 문서화되지 않은 contract이므로 클라이언트에서 defensive하게 정렬.

## 필드 사전

| API 필드     | 한글           | 단위    | 정규화 키  | 비고 |
|--------------|----------------|---------|-----------|------|
| `YMD`        | 날짜           | YYYYMMDD | (timestamp) | `parseTimestamp(YMD, HR)` 로 KST Date |
| `HR`         | 시각           | HH:MM   | (timestamp) | 위와 함께 |
| `MSRSTN_NM`  | 측정소명       | —       | `station` | 탄천 / 중랑천 / 안양천 / 선유 |
| `WATT`       | 수온           | °C      | `watt`    | 등급 산정 안 함 |
| `TOT_PH`     | pH             | —       | `ph`      | 등급 산정 (range) |
| `TOT_DO`     | 용존산소       | mg/L    | `doO2`    | 등급 산정 (floor). 키명에 `do`는 JS 예약어 → `doO2` |
| `TOT_N`      | 총질소         | mg/L    | `totalN`  | 등급 산정 안 함 (호소 기준만) |
| `TOT_TP`     | 총인 (T-P)     | mg/L    | `totalP`  | 등급 산정 (ceiling) |
| `TOT_OC`     | 총유기탄소 (TOC) | mg/L  | `totalOC` | 등급 산정 (ceiling) |
| `PHNL`       | 페놀           | mg/L    | `phenol`  | 독성 (별도 표기, 종합 등급 미포함) |
| `CN`         | 시안           | mg/L    | `cyanide` | 독성 (별도 표기, 종합 등급 미포함) |

## 알려진 데이터 이슈

- **`"점검중"` 문자열**: 숫자 필드 자리에 한글이 들어오는 경우 있음. 정규화 단계에서 `null` 로 변환. 2026-05-19 smoke test에서 500행 중 192행이 최소 1개 셀에 `"점검중"` 포함.
- **CORS 헤더 없음**: 브라우저 직접 호출 불가. dev: Vite proxy. Phase 2: `apps/api`.

## RESULT 코드

| CODE         | 의미                          |
|--------------|-------------------------------|
| `INFO-000`   | 정상 처리                     |
| `INFO-100`   | 인증키 없음/잘못됨            |
| `INFO-200`   | 해당 데이터 없음              |
| `ERROR-300`  | 필수 값 누락                  |
| `ERROR-301`  | 파일 형식 값 누락             |
| `ERROR-310`  | 잘못된 서비스명               |
| `ERROR-331`  | 잘못된 요청시작/종료위치      |
| `ERROR-336`  | 데이터 요청 제한 초과 (1,000건) |
| `ERROR-500`  | 서버 오류                     |
| `ERROR-600`  | 데이터베이스 오류             |
| `ERROR-601`  | SQL 오류                      |

`apps/web/src/lib/api.ts`는 `INFO-000` 외 모든 코드를 에러로 throw.
