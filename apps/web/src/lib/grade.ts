// 수질 등급 평가 (환경정책기본법 시행규칙 별표 1 — 하천 생활환경기준).
//
// 본 모듈의 THRESHOLDS는 docs/grading.md, docs/dashboard.html §5와 1:1 일치해야 함.
// 별표 1 개정 시 3 파일 동시 변경 + ADR-0003 참조.
//
// Pure functions — no React imports — Phase 2 backend/geometry 재사용 가능.

import {
  GRADES,
  type Grade,
  type GradeOrNA,
  type GradedMetric,
  type Measurements,
} from '../types/waterQuality'

type ThresholdSpec =
  | { kind: 'ceiling'; max: number }            // v <= max
  | { kind: 'floor'; min: number }              // v >= min
  | { kind: 'range'; min: number; max: number } // min <= v <= max

export const THRESHOLDS: Record<GradedMetric, Record<Grade, ThresholdSpec>> = {
  ph: {
    Ia: { kind: 'range', min: 6.5, max: 8.5 },
    Ib: { kind: 'range', min: 6.5, max: 8.5 },
    II: { kind: 'range', min: 6.5, max: 8.5 },
    III: { kind: 'range', min: 6.5, max: 8.5 },
    IV: { kind: 'range', min: 6.0, max: 8.5 },
    V: { kind: 'range', min: 6.0, max: 8.5 },
    VI: { kind: 'range', min: -Infinity, max: Infinity },
  },
  doO2: {
    Ia: { kind: 'floor', min: 7.5 },
    Ib: { kind: 'floor', min: 5.0 },
    II: { kind: 'floor', min: 5.0 },
    III: { kind: 'floor', min: 5.0 },
    IV: { kind: 'floor', min: 2.0 },
    V: { kind: 'floor', min: 2.0 },
    VI: { kind: 'floor', min: -Infinity },
  },
  totalOC: {
    Ia: { kind: 'ceiling', max: 2 },
    Ib: { kind: 'ceiling', max: 3 },
    II: { kind: 'ceiling', max: 4 },
    III: { kind: 'ceiling', max: 5 },
    IV: { kind: 'ceiling', max: 6 },
    V: { kind: 'ceiling', max: 8 },
    VI: { kind: 'ceiling', max: Infinity },
  },
  totalP: {
    Ia: { kind: 'ceiling', max: 0.02 },
    Ib: { kind: 'ceiling', max: 0.04 },
    II: { kind: 'ceiling', max: 0.1 },
    III: { kind: 'ceiling', max: 0.2 },
    IV: { kind: 'ceiling', max: 0.3 },
    V: { kind: 'ceiling', max: 0.5 },
    VI: { kind: 'ceiling', max: Infinity },
  },
}

function matches(spec: ThresholdSpec, v: number): boolean {
  switch (spec.kind) {
    case 'ceiling':
      return v <= spec.max
    case 'floor':
      return v >= spec.min
    case 'range':
      return v >= spec.min && v <= spec.max
  }
}

// Ia → VI 순으로 평가하여 처음으로 조건을 만족하는 등급 반환. null 입력은 null 반환.
export function gradeFor(metric: GradedMetric, v: number | null): Grade | null {
  if (v === null || !Number.isFinite(v)) return null
  for (const g of GRADES) {
    if (matches(THRESHOLDS[metric][g], v)) return g
  }
  return 'VI'
}

function worse(a: Grade, b: Grade): Grade {
  return GRADES.indexOf(a) >= GRADES.indexOf(b) ? a : b
}

// pH / DO / TOC / T-P 4개 중 worst (null skip). 모두 null → 'unmeasurable'.
// ADR-0002 참조.
export function compositeGrade(m: Measurements): GradeOrNA {
  const found: Grade[] = []
  for (const metric of ['ph', 'doO2', 'totalOC', 'totalP'] as const) {
    const g = gradeFor(metric, m[metric])
    if (g) found.push(g)
  }
  if (found.length === 0) return 'unmeasurable'
  return found.reduce(worse)
}

// ─── 등급 score (시계열용) ───────────────────────────────────────────────
//
// 차트에서 "위 = 좋음" 통상의 멘탈 모델에 맞추기 위해 Ia를 가장 큰 수, VI를 0으로.
// unmeasurable → null (라인 끊김으로 렌더).

export function gradeScore(g: GradeOrNA): number | null {
  if (g === 'unmeasurable') return null
  return GRADES.length - 1 - GRADES.indexOf(g)
}

export function gradeFromScore(score: number): Grade | null {
  const idx = GRADES.length - 1 - score
  if (idx < 0 || idx >= GRADES.length) return null
  return GRADES[idx]
}

// 직전 시점(현재 - lookback) 대비 등급 step 변화량.
// 반환: { delta, fromGrade, toGrade }. delta > 0 = 개선(score 증가), < 0 = 악화, 0 = 동일.
// 어느 한 쪽이라도 unmeasurable이거나 비교 row 없으면 null.

export interface GradeDelta {
  delta: number
  fromGrade: Grade
  toGrade: Grade
  fromTimestamp: Date
  toTimestamp: Date
}

export function gradeDelta(
  current: { row: Measurements & { timestamp: Date }; prev: (Measurements & { timestamp: Date }) | undefined },
): GradeDelta | null {
  if (!current.prev) return null
  const now = compositeGrade(current.row)
  const before = compositeGrade(current.prev)
  if (now === 'unmeasurable' || before === 'unmeasurable') return null
  const nowScore = gradeScore(now)
  const beforeScore = gradeScore(before)
  if (nowScore === null || beforeScore === null) return null
  return {
    delta: nowScore - beforeScore,
    fromGrade: before,
    toGrade: now,
    fromTimestamp: current.prev.timestamp,
    toTimestamp: current.row.timestamp,
  }
}

// ─── 독성 (페놀, 시안) — 종합 등급에 포함하지 않음 (ADR-0002) ──────────────

export type ToxState = 'detected' | 'undetected' | 'unmeasurable'

export interface ToxicantStatus {
  phenol: ToxState
  cyanide: ToxState
}

function toxState(v: number | null): ToxState {
  if (v === null) return 'unmeasurable'
  return v > 0 ? 'detected' : 'undetected'
}

export function toxicantStatus(m: Measurements): ToxicantStatus {
  return {
    phenol: toxState(m.phenol),
    cyanide: toxState(m.cyanide),
  }
}

// ─── 차트용 등급 경계선 ──────────────────────────────────────────────────

export interface Boundary {
  grade: Grade
  value: number
  kind: 'lower' | 'upper'
}

// 차트 ReferenceLine 용. 같은 값이 여러 등급에서 반복되는 경우(예: DO 5.0이 Ib/II/III)
// 중복 제거 — 시각적으로 동일한 위치에 여러 라인이 겹치는 것 방지.
export function boundariesFor(metric: GradedMetric): Boundary[] {
  const result: Boundary[] = []
  const seen = new Set<string>()
  for (const g of GRADES) {
    const spec = THRESHOLDS[metric][g]
    const candidates: Boundary[] = []
    if (spec.kind === 'ceiling') {
      if (Number.isFinite(spec.max)) candidates.push({ grade: g, value: spec.max, kind: 'upper' })
    } else if (spec.kind === 'floor') {
      if (Number.isFinite(spec.min)) candidates.push({ grade: g, value: spec.min, kind: 'lower' })
    } else {
      if (Number.isFinite(spec.min)) candidates.push({ grade: g, value: spec.min, kind: 'lower' })
      if (Number.isFinite(spec.max)) candidates.push({ grade: g, value: spec.max, kind: 'upper' })
    }
    for (const b of candidates) {
      const key = `${b.value}-${b.kind}`
      if (!seen.has(key)) {
        seen.add(key)
        result.push(b)
      }
    }
  }
  return result
}

// ─── DEV-only sanity checks (테스트 프레임워크 도입 X) ────────────────────

if (import.meta.env.DEV) {
  const nullM: Measurements = {
    watt: null, ph: null, doO2: null, totalN: null,
    totalP: null, totalOC: null, phenol: null, cyanide: null,
  }
  const expect = (cond: boolean, label: string) => {
    if (!cond) console.warn('[grade.ts assertion failed]', label)
  }
  expect(gradeFor('doO2', 8) === 'Ia', 'DO 8 → Ia')
  expect(gradeFor('doO2', 6) === 'Ib', 'DO 6 → Ib')
  expect(gradeFor('doO2', 4) === 'IV', 'DO 4 → IV')
  expect(gradeFor('doO2', 1) === 'VI', 'DO 1 → VI')
  expect(gradeFor('ph', 7) === 'Ia', 'pH 7 → Ia')
  expect(gradeFor('ph', 6.2) === 'IV', 'pH 6.2 → IV')
  expect(gradeFor('ph', 5.9) === 'VI', 'pH 5.9 → VI')
  expect(gradeFor('totalOC', 2) === 'Ia', 'TOC 2 → Ia')
  expect(gradeFor('totalOC', 7) === 'V', 'TOC 7 → V')
  expect(gradeFor('totalOC', 10) === 'VI', 'TOC 10 → VI')
  expect(gradeFor('totalP', 0.02) === 'Ia', 'T-P 0.02 → Ia')
  expect(gradeFor('totalP', 0.6) === 'VI', 'T-P 0.6 → VI')
  expect(gradeFor('doO2', null) === null, 'null → null')
  expect(compositeGrade(nullM) === 'unmeasurable', 'all-null → unmeasurable')
  expect(
    compositeGrade({ ...nullM, ph: 7, doO2: 8, totalOC: 2, totalP: 0.02 }) === 'Ia',
    'all Ia → Ia',
  )
  expect(
    compositeGrade({ ...nullM, ph: 7, doO2: 4, totalOC: 2, totalP: 0.02 }) === 'IV',
    'one IV → IV (worst-of)',
  )
}
