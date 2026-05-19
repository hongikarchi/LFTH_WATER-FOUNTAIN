import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { compositeGrade, gradeFromScore, gradeScore } from '../lib/grade'
import { recentWindow } from '../lib/normalize'
import {
  GRADES,
  GRADE_COLORS,
  GRADE_LABELS,
  STATIONS,
  type NormalizedRow,
} from '../types/waterQuality'

interface Props {
  rows: NormalizedRow[]
  windowHours?: number
}

const STATION_COLORS: Record<string, string> = {
  탄천: '#0072B2',
  중랑천: '#D55E00',
  안양천: '#009E73',
  선유: '#CC79A7',
}

interface PivotRow {
  ts: number
  label: string
  탄천: number | null
  중랑천: number | null
  안양천: number | null
  선유: number | null
}

function pivotGrades(rows: NormalizedRow[]): PivotRow[] {
  const byTs = new Map<number, PivotRow>()
  for (const r of rows) {
    const ts = r.timestamp.getTime()
    let entry = byTs.get(ts)
    if (!entry) {
      entry = {
        ts,
        label: r.timestamp.toLocaleString('ko-KR', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          hour12: false,
        }),
        탄천: null,
        중랑천: null,
        안양천: null,
        선유: null,
      }
      byTs.set(ts, entry)
    }
    if (r.station in entry) {
      entry[r.station as keyof Omit<PivotRow, 'ts' | 'label'>] = gradeScore(compositeGrade(r))
    }
  }
  return Array.from(byTs.values()).sort((a, b) => a.ts - b.ts)
}

const MAX_SCORE = GRADES.length - 1 // 6

// Y축 tick → 등급 글자.
function formatGradeTick(v: number): string {
  const g = gradeFromScore(v)
  return g ?? ''
}

function formatTooltipValue(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'number') {
    const g = gradeFromScore(v)
    return g ? `${g} (${GRADE_LABELS[g]})` : '—'
  }
  return String(v)
}

export function GradeTimelineChart({ rows, windowHours = 24 }: Props) {
  const data = useMemo(() => pivotGrades(recentWindow(rows, windowHours)), [rows, windowHours])

  return (
    <section className="chart-section">
      <div className="chart-header">
        <h2>최근 {windowHours}시간 종합 등급 변화</h2>
        <span className="chart-axis-hint">위 = 좋음 / 아래 = 나쁨</span>
      </div>
      {data.length === 0 ? (
        <div className="empty-state">표시할 데이터가 없습니다.</div>
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={24} />
              <YAxis
                type="number"
                domain={[0, MAX_SCORE]}
                ticks={[0, 1, 2, 3, 4, 5, 6]}
                tickFormatter={formatGradeTick}
                tick={{ fontSize: 12, fontWeight: 600 }}
                width={48}
              />
              <Tooltip formatter={formatTooltipValue} />
              <Legend />
              {STATIONS.map((station) => (
                <Line
                  key={station}
                  type="stepAfter"
                  dataKey={station}
                  stroke={STATION_COLORS[station]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="grade-legend-strip">
            {GRADES.map((g) => {
              const c = GRADE_COLORS[g]
              return (
                <span
                  key={g}
                  className="grade-legend-pill"
                  style={{ background: c.bg, color: c.fg, borderColor: c.border }}
                >
                  {g} · {GRADE_LABELS[g]}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
