interface HeaderProps {
  lastUpdated: Date | null
  nextExpectedAt: Date | null
  isLoading: boolean
  isBackgroundRefetching: boolean
  onRefresh: () => void
}

function formatTime(d: Date | null): string {
  if (!d) return '—'
  return d.toLocaleTimeString('ko-KR', { hour12: false })
}

function formatNextExpected(d: Date | null): string {
  if (!d) return '—'
  const now = Date.now()
  const diff = d.getTime() - now
  if (diff <= 0) return `${formatTime(d)} (도래)`
  const min = Math.ceil(diff / 60000)
  return `${formatTime(d)} (약 ${min}분 후)`
}

export function Header({
  lastUpdated,
  nextExpectedAt,
  isLoading,
  isBackgroundRefetching,
  onRefresh,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="title-block">
        <h1>한강 수질 실시간 모니터링</h1>
        <p className="subtitle">
          서울시 한강 및 주요지천 수질 측정 자료 — 시간 단위 갱신 (마운트 시 1회 + 수동 새로고침)
        </p>
      </div>
      <div className="meta-block">
        <span className="last-updated">
          마지막 fetch: <strong>{formatTime(lastUpdated)}</strong>
          {isBackgroundRefetching && <span className="bg-refetch-hint"> · 백그라운드 갱신중</span>}
        </span>
        <span className="next-expected">
          다음 데이터 예상: <strong>{formatNextExpected(nextExpectedAt)}</strong>
        </span>
        <button type="button" onClick={onRefresh} disabled={isLoading} className="refresh-btn">
          {isLoading ? '불러오는 중…' : '새로고침'}
        </button>
      </div>
    </header>
  )
}
