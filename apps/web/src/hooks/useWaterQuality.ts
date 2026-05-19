import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchWaterQuality } from '../lib/api'
import { normalizeRows } from '../lib/normalize'
import type { NormalizedRow } from '../types/waterQuality'

interface UseWaterQualityOptions {
  limit?: number
  /** 캐시된 데이터의 최신 timestamp가 이 ms 이상 오래되면 mount 시 silent refetch. 기본 1h. */
  staleAfterMs?: number
}

interface UseWaterQualityResult {
  rows: NormalizedRow[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  /** 다음에 새 upstream 데이터가 들어올 것으로 예상되는 시각 (latest data ts + 1h). */
  nextExpectedAt: Date | null
  /** 캐시 hit 후 silent refetch 진행중 여부 */
  isBackgroundRefetching: boolean
  refetch: () => void
}

const CACHE_KEY = 'lfth-wq-cache-v1'
const ONE_HOUR_MS = 60 * 60 * 1000

interface CacheShape {
  rows: Array<Omit<NormalizedRow, 'timestamp'> & { timestamp: string }>
  fetchedAt: string
}

function loadCache(): { rows: NormalizedRow[]; fetchedAt: Date } | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheShape
    const rows = parsed.rows
      .map((r) => ({ ...r, timestamp: new Date(r.timestamp) }))
      .filter((r) => !Number.isNaN(r.timestamp.getTime()))
    return { rows, fetchedAt: new Date(parsed.fetchedAt) }
  } catch {
    return null
  }
}

function saveCache(rows: NormalizedRow[]): void {
  try {
    const payload: CacheShape = {
      rows: rows.map((r) => ({ ...r, timestamp: r.timestamp.toISOString() })),
      fetchedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    // quota 초과/private mode 등 — 캐시 실패는 무시
  }
}

function maxTimestamp(rows: NormalizedRow[]): Date | null {
  if (rows.length === 0) return null
  return rows.reduce((acc, r) => (r.timestamp > acc ? r.timestamp : acc), rows[0].timestamp)
}

export function useWaterQuality(options: UseWaterQualityOptions = {}): UseWaterQualityResult {
  const { limit = 500, staleAfterMs = ONE_HOUR_MS } = options

  const [rows, setRows] = useState<NormalizedRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isBackgroundRefetching, setIsBackgroundRefetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const requestIdRef = useRef(0)
  const mountedRef = useRef(true)

  const runFetch = useCallback(
    async (mode: 'foreground' | 'background') => {
      const id = ++requestIdRef.current
      if (mode === 'foreground') setIsLoading(true)
      else setIsBackgroundRefetching(true)
      setError(null)
      try {
        const raw = await fetchWaterQuality(limit)
        if (!mountedRef.current || id !== requestIdRef.current) return
        const normalized = normalizeRows(raw)
        setRows(normalized)
        setLastUpdated(new Date())
        saveCache(normalized)
      } catch (e) {
        if (!mountedRef.current || id !== requestIdRef.current) return
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (mountedRef.current && id === requestIdRef.current) {
          if (mode === 'foreground') setIsLoading(false)
          else setIsBackgroundRefetching(false)
        }
      }
    },
    [limit],
  )

  // 사용자가 직접 호출하는 refetch — 항상 foreground 강제 fetch
  const refetch = useCallback(() => {
    void runFetch('foreground')
  }, [runFetch])

  useEffect(() => {
    mountedRef.current = true
    const cached = loadCache()
    // React 19 "set-state-in-effect" 규칙은 mount-triggered 캐시 hydration + fetch 패턴을
    // 잘못 플래그함 — 외부(localStorage/네트워크) → React 상태 sync는 정확히 effect 용도.
    if (cached && cached.rows.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRows(cached.rows)
      setLastUpdated(cached.fetchedAt)
      const maxTs = maxTimestamp(cached.rows)
      const age = maxTs ? Date.now() - maxTs.getTime() : Number.POSITIVE_INFINITY
      if (age >= staleAfterMs) {
        void runFetch('background')
      }
    } else {
      void runFetch('foreground')
    }
    return () => {
      mountedRef.current = false
    }
  }, [runFetch, staleAfterMs])

  // 다음 데이터 예상 시각 = 마지막 데이터 timestamp + 1h
  const maxTs = maxTimestamp(rows)
  const nextExpectedAt = maxTs ? new Date(maxTs.getTime() + ONE_HOUR_MS) : null

  return { rows, isLoading, error, lastUpdated, nextExpectedAt, isBackgroundRefetching, refetch }
}
