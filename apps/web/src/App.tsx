import './App.css'
import { Header } from './components/Header'
import { LatestTable } from './components/LatestTable'
import { TimeSeriesChart } from './components/TimeSeriesChart'
import { useWaterQuality } from './hooks/useWaterQuality'

function App() {
  const { rows, isLoading, error, lastUpdated, refetch } = useWaterQuality()

  return (
    <div className="app-shell">
      <Header lastUpdated={lastUpdated} isLoading={isLoading} onRefresh={refetch} />
      {error && <div className="error-banner">에러: {error}</div>}
      <LatestTable rows={rows} />
      <TimeSeriesChart rows={rows} />
    </div>
  )
}

export default App
