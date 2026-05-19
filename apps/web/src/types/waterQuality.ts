// Field names mirror the Seoul Open API response. Korean field meaning kept in
// comments so renaming the normalized model stays traceable to the source.

export interface RawRow {
  YMD: string          // YYYYMMDD
  HR: string           // HH:MM
  MSRSTN_NM: string    // 측정소명 (탄천 | 중랑천 | 안양천 | 선유)
  WATT: string         // 수온 °C
  TOT_PH: string       // pH
  TOT_DO: string       // 용존산소 mg/L
  TOT_N: string        // 총질소
  TOT_TP: string       // 총인
  TOT_OC: string       // 총유기탄소
  PHNL: string         // 페놀
  CN: string           // 시안
}

export interface RawResponse {
  WPOSInformationTime: {
    list_total_count: number
    RESULT: { CODE: string; MESSAGE: string }
    row: RawRow[]
  }
}

// Numeric fields can be the literal string "점검중" (under inspection) — these
// become null in the normalized model so charts/tables can treat them uniformly.
export interface Measurements {
  watt: number | null      // 수온 °C
  ph: number | null        // pH
  doO2: number | null      // 용존산소 mg/L  ('do' is a reserved word in JS)
  totalN: number | null    // 총질소
  totalP: number | null    // 총인
  totalOC: number | null   // 총유기탄소
  phenol: number | null    // 페놀
  cyanide: number | null   // 시안
}

export interface NormalizedRow extends Measurements {
  timestamp: Date
  station: string
}

export type MetricKey = keyof Measurements

// Display labels for metrics (Korean UI). Centralised so the chart/table share the same names.
export const METRIC_LABELS: Record<MetricKey, string> = {
  watt: '수온 (°C)',
  ph: 'pH',
  doO2: '용존산소 (mg/L)',
  totalN: '총질소',
  totalP: '총인',
  totalOC: '총유기탄소',
  phenol: '페놀',
  cyanide: '시안',
}

export const STATIONS = ['탄천', '중랑천', '안양천', '선유'] as const
export type StationName = (typeof STATIONS)[number]
