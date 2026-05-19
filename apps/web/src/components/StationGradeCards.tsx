import { compositeGrade, toxicantStatus, type ToxState } from '../lib/grade'
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
