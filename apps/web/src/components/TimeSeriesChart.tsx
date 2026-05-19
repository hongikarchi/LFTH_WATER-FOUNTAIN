import { useMemo, useState } from 'react'
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
import { recentWindow } from '../lib/normalize'
import {
  METRIC_LABELS,
  STATIONS,
  type MetricKey,
  type NormalizedRow,
} from '../types/waterQuality'

interface TimeSeriesChartProps {
  rows: NormalizedRow[]
  windowHours?: number
}

// 4 측정소에 안정적으로 구분되는 색. 색약 안전 팔레트(Okabe-Ito) 일부.
const STATION_COLORS: Record<string, string> = {
  탄천: '#0072B2',
  중랑천: '#D55E00',
  안양천: '#009E73',
  선유: '#CC79A7',
}

interface PivotRow {
  ts: number  // numeric ms for chart axis
  label: string
  탄천: number | null
  중랑천: number | null
  안양천: number | null
  선유: number | null
}

function pivot(rows: NormalizedRow[], metric: MetricKey): PivotRow[] {
  // Group by timestamp (string key) — same hour from different stations merge into one row.
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
      entry[r.station as keyof Omit<PivotRow, 'ts' | 'label'>] = r[metric]
    }
  }
  return Array.from(byTs.values()).sort((a, b) => a.ts - b.ts)
}

export function TimeSeriesChart({ rows, windowHours = 24 }: TimeSeriesChartProps) {
  const [metric, setMetric] = useState<MetricKey>('watt')

  const data = useMemo(() => pivot(recentWindow(rows, windowHours), metric), [
    rows,
    metric,
    windowHours,
  ])

  return (
    <section className="chart-section">
      <div className="chart-header">
        <h2>최근 {windowHours}시간 시계열</h2>
        <label className="metric-picker">
          항목:
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricKey)}
          >
            {(Object.keys(METRIC_LABELS) as MetricKey[]).map((m) => (
              <option key={m} value={m}>
                {METRIC_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {data.length === 0 ? (
        <div className="empty-state">표시할 데이터가 없습니다.</div>
      ) : (
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={24} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => (value === null || value === undefined ? '—' : value)}
              />
              <Legend />
              {STATIONS.map((station) => (
                <Line
                  key={station}
                  type="monotone"
                  dataKey={station}
                  stroke={STATION_COLORS[station]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
