import { gradeFor } from '../lib/grade'
import { latestPerStation } from '../lib/normalize'
import {
  GRADED_METRICS,
  GRADE_COLORS,
  METRIC_LABELS,
  type GradedMetric,
  type MetricKey,
  type NormalizedRow,
} from '../types/waterQuality'

const GRADED_SET = new Set<MetricKey>(GRADED_METRICS)

interface LatestTableProps {
  rows: NormalizedRow[]
}

const DISPLAY_METRICS: MetricKey[] = [
  'watt',
  'ph',
  'doO2',
  'totalN',
  'totalP',
  'totalOC',
  'phenol',
  'cyanide',
]

function formatValue(v: number | null): string {
  if (v === null) return '—'
  // 측정값 자리수를 통일 (소수 둘째 자리). pH는 한 자리만 의미 있는 경우가 많지만
  // 통일된 포맷이 표 가독성에 더 도움됨.
  return v.toFixed(v >= 100 ? 1 : 2)
}

function formatTimestamp(d: Date): string {
  return d.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function LatestTable({ rows }: LatestTableProps) {
  const latest = latestPerStation(rows)

  if (latest.length === 0) {
    return <div className="empty-state">데이터가 아직 없습니다.</div>
  }

  return (
    <section className="latest-table-section">
      <h2>측정소별 최신값</h2>
      <div className="table-wrap">
        <table className="latest-table">
          <thead>
            <tr>
              <th>측정소</th>
              <th>측정 시각</th>
              {DISPLAY_METRICS.map((m) => (
                <th key={m}>{METRIC_LABELS[m]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {latest.map((row) => (
              <tr key={row.station}>
                <td className="station-cell">{row.station}</td>
                <td>{formatTimestamp(row.timestamp)}</td>
                {DISPLAY_METRICS.map((m) => {
                  const v = row[m]
                  const showDot = GRADED_SET.has(m) && v !== null
                  const grade = showDot ? gradeFor(m as GradedMetric, v) : null
                  return (
                    <td key={m} className={v === null ? 'null-cell' : 'value-cell'}>
                      {grade && (
                        <span
                          className="grade-dot"
                          style={{ background: GRADE_COLORS[grade].bg }}
                          title={`등급 ${grade}`}
                        />
                      )}
                      {formatValue(v)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
