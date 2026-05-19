import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWaterQuality } from '../lib/api'
import { normalizeRows } from '../lib/normalize'
import type { NormalizedRow } from '../types/waterQuality'

interface UseWaterQualityOptions {
  intervalMs?: number
  limit?: number
}

interface UseWaterQualityResult {
  rows: NormalizedRow[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  refetch: () => void
}

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000

export function useWaterQuality(options: UseWaterQualityOptions = {}): UseWaterQualityResult {
  const { intervalMs = DEFAULT_INTERVAL_MS, limit = 500 } = options

  const [rows, setRows] = useState<NormalizedRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Monotonic request counter — stale responses (out-of-order completion) are dropped.
  const requestIdRef = useRef(0)
  const mountedRef = useRef(true)

  const refetch = useCallback(async () => {
    const id = ++requestIdRef.current
    setIsLoading(true)
    setError(null)
    try {
      const raw = await fetchWaterQuality(limit)
      if (!mountedRef.current || id !== requestIdRef.current) return
      setRows(normalizeRows(raw))
      setLastUpdated(new Date())
    } catch (e) {
      if (!mountedRef.current || id !== requestIdRef.current) return
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (mountedRef.current && id === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [limit])

  useEffect(() => {
    mountedRef.current = true
    // Initial fetch + interval polling. The React 19 "set-state-in-effect" lint
    // rule flags refetch() here because it calls setIsLoading synchronously, but
    // mount-triggered data fetching is exactly the intended use of useEffect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch()
    const handle = window.setInterval(refetch, intervalMs)
    return () => {
      mountedRef.current = false
      window.clearInterval(handle)
    }
  }, [refetch, intervalMs])

  return { rows, isLoading, error, lastUpdated, refetch }
}
