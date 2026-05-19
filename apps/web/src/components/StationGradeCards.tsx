import { compositeGrade, gradeDelta, toxicantStatus, type GradeDelta, type ToxState } from '../lib/grade'
import { latestPerStation } from '../lib/normalize'
import {
  GRADE_COLORS,
  GRADE_LABELS,
  type GradeOrNA,
  type NormalizedRow,
} from '../types/waterQuality'

interface Props {
  rows: NormalizedRow[]
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

const TOX_LABEL: Record<ToxState, string> = {
  detected: '검출',
  undetected: '불검출',
  unmeasurable: '—',
}

function ToxPill({ name, state }: { name: string; state: ToxState }) {
  return (
    <span className={`tox-pill tox-${state}`}>
      <span className="tox-name">{name}</span>
      <span className="tox-state">{TOX_LABEL[state]}</span>
    </span>
  )
}

// 동일 station의 가장 최근 row 직전 row 찾기. 데이터가 시간 단위라 1h 전 row가 됨.
function findPrevRow(rows: NormalizedRow[], station: string, currentTs: number): NormalizedRow | undefined {
  let best: NormalizedRow | undefined
  for (const r of rows) {
    if (r.station !== station) continue
    const ts = r.timestamp.getTime()
    if (ts < currentTs && (!best || ts > best.timestamp.getTime())) {
      best = r
    }
  }
  return best
}

function DeltaBadge({ delta }: { delta: GradeDelta | null }) {
  if (delta === null) {
    return <span className="delta-badge delta-na">vs 1h: —</span>
  }
  if (delta.delta === 0) {
    return <span className="delta-badge delta-flat">vs 1h: = 동일</span>
  }
  // score increase = improved (위로); decrease = worsened.
  const improved = delta.delta > 0
  const arrow = improved ? '▲' : '▼'
  const word = improved ? '개선' : '악화'
  const steps = Math.abs(delta.delta)
  return (
    <span className={`delta-badge ${improved ? 'delta-up' : 'delta-down'}`}>
      vs 1h: {arrow} {steps}단계 {word}
    </span>
  )
}

export function StationGradeCards({ rows }: Props) {
  const latest = latestPerStation(rows)
  if (latest.length === 0) return null

  return (
    <section className="grade-cards-section">
      <h2>측정소별 종합 등급</h2>
      <div className="grade-cards-grid">
        {latest.map((row) => {
          const grade: GradeOrNA = compositeGrade(row)
          const tox = toxicantStatus(row)
          const palette = GRADE_COLORS[grade]
          const isNA = grade === 'unmeasurable'
          const prev = findPrevRow(rows, row.station, row.timestamp.getTime())
          const delta = gradeDelta({ row, prev })
          return (
            <article
              key={row.station}
              className="grade-card"
              style={{
                background: palette.bg,
                color: palette.fg,
                borderColor: palette.border,
              }}
            >
              <header className="grade-card-station">{row.station}</header>
              <div className="grade-card-badge">{isNA ? '측정불가' : grade}</div>
              <div className="grade-card-label">
                {isNA ? '현재 측정 데이터 없음' : GRADE_LABELS[grade]}
              </div>
              <DeltaBadge delta={delta} />
              <div className="tox-badges">
                <ToxPill name="페놀" state={tox.phenol} />
                <ToxPill name="시안" state={tox.cyanide} />
              </div>
              <footer className="grade-card-ts">{formatTimestamp(row.timestamp)}</footer>
            </article>
          )
        })}
      </div>
    </section>
  )
}
