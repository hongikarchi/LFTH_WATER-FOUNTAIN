// Pure functions — no React imports — so Phase 2 backend/geometry layers can reuse the rules.
//
// Empirical row ordering of the upstream API (verified 2026-05-19): newest → oldest.
// We still sort client-side because that contract is undocumented and could change.

import type { Measurements, NormalizedRow, RawResponse, RawRow } from '../types/waterQuality'

// Numeric fields may contain "점검중" (under inspection) or be blank. Treat both
// (and any other non-numeric string) as null so downstream code never sees NaN.
export function parseNumeric(v: string | null | undefined): number | null {
  if (v == null) return null
  const trimmed = v.trim()
  if (trimmed === '' || trimmed === '점검중') return null
  const n = Number.parseFloat(trimmed)
  return Number.isFinite(n) ? n : null
}

// YMD = "20260519", HR = "09:00". Build an ISO string with explicit KST offset
// so the same Date is produced regardless of the viewer's local timezone.
export function parseTimestamp(ymd: string, hr: string): Date {
  const iso = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}T${hr}:00+09:00`
  return new Date(iso)
}

function normalizeMeasurements(row: RawRow): Measurements {
  return {
    watt: parseNumeric(row.WATT),
    ph: parseNumeric(row.TOT_PH),
    doO2: parseNumeric(row.TOT_DO),
    totalN: parseNumeric(row.TOT_N),
    totalP: parseNumeric(row.TOT_TP),
    totalOC: parseNumeric(row.TOT_OC),
    phenol: parseNumeric(row.PHNL),
    cyanide: parseNumeric(row.CN),
  }
}

export function normalizeRows(response: RawResponse): NormalizedRow[] {
  const rows = response.WPOSInformationTime?.row ?? []
  return rows
    .map<NormalizedRow>((row) => ({
      timestamp: parseTimestamp(row.YMD, row.HR),
      station: row.MSRSTN_NM,
      ...normalizeMeasurements(row),
    }))
    .filter((r) => !Number.isNaN(r.timestamp.getTime()))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

// Latest single row per station — used by LatestTable.
export function latestPerStation(rows: NormalizedRow[]): NormalizedRow[] {
  const byStation = new Map<string, NormalizedRow>()
  for (const r of rows) {
    const existing = byStation.get(r.station)
    if (!existing || r.timestamp > existing.timestamp) {
      byStation.set(r.station, r)
    }
  }
  return Array.from(byStation.values()).sort((a, b) => a.station.localeCompare(b.station, 'ko'))
}

// Rows within the last `hours` from the dataset's max timestamp — used by the chart.
// Anchored to the data's own max, not Date.now(), so the chart still renders
// when the upstream feed lags behind real time.
export function recentWindow(rows: NormalizedRow[], hours = 24): NormalizedRow[] {
  if (rows.length === 0) return rows
  const maxTs = rows.reduce((acc, r) => (r.timestamp > acc ? r.timestamp : acc), rows[0].timestamp)
  const cutoff = maxTs.getTime() - hours * 60 * 60 * 1000
  return rows.filter((r) => r.timestamp.getTime() >= cutoff)
}
