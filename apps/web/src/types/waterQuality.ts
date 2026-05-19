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

// ─── 수질 등급 (환경정책기본법 시행규칙 별표 1 — 하천 생활환경기준) ──────────
// 등급/색/매핑은 docs/grading.md, docs/dashboard.html §5와 1:1 일치 (ADR-0003).

export const GRADES = ['Ia', 'Ib', 'II', 'III', 'IV', 'V', 'VI'] as const
export type Grade = (typeof GRADES)[number]
export type GradeOrNA = Grade | 'unmeasurable'

export const GRADE_LABELS: Record<Grade, string> = {
  Ia: '매우 좋음',
  Ib: '좋음',
  II: '약간 좋음',
  III: '보통',
  IV: '약간 나쁨',
  V: '나쁨',
  VI: '매우 나쁨',
}

// ColorBrewer RdYlBu_r 7-class — 명도 순서 보존 (색약 안전).
// 등급 글자(Ia/Ib/...)는 색과 함께 항상 표시되어야 함.
export const GRADE_COLORS: Record<GradeOrNA, { bg: string; fg: string; border: string }> = {
  Ia: { bg: '#4575b4', fg: '#ffffff', border: '#2c5282' },
  Ib: { bg: '#74add1', fg: '#0f172a', border: '#4575b4' },
  II: { bg: '#abd9e9', fg: '#0f172a', border: '#74add1' },
  III: { bg: '#fee090', fg: '#0f172a', border: '#fdae61' },
  IV: { bg: '#fdae61', fg: '#0f172a', border: '#f46d43' },
  V: { bg: '#f46d43', fg: '#ffffff', border: '#d73027' },
  VI: { bg: '#d73027', fg: '#ffffff', border: '#a50026' },
  unmeasurable: { bg: '#e2e8f0', fg: '#64748b', border: '#cbd5e1' },
}

// 별표 1 하천 기준이 있는 metric만 등급 평가. T-N은 호소 기준만 존재.
export type GradedMetric = Extract<MetricKey, 'ph' | 'doO2' | 'totalOC' | 'totalP'>
export const GRADED_METRICS: readonly GradedMetric[] = ['ph', 'doO2', 'totalOC', 'totalP'] as const
