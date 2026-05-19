interface HeaderProps {
  lastUpdated: Date | null
  isLoading: boolean
  onRefresh: () => void
}

function formatTime(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleTimeString('ko-KR', { hour12: false })
}

export function Header({ lastUpdated, isLoading, onRefresh }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="title-block">
        <h1>한강 수질 실시간 모니터링</h1>
        <p className="subtitle">서울시 한강 및 주요지천 수질 측정 자료 — 시간 단위 갱신</p>
      </div>
      <div className="meta-block">
        <span className="last-updated">
          마지막 업데이트: <strong>{formatTime(lastUpdated)}</strong>
        </span>
        <button type="button" onClick={onRefresh} disabled={isLoading} className="refresh-btn">
          {isLoading ? '불러오는 중…' : '새로고침'}
        </button>
      </div>
    </header>
  )
}
