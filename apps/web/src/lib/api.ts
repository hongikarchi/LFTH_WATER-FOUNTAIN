import type { RawResponse } from '../types/waterQuality'

// `/api` is rewritten by the Vite dev server to inject the API key server-side.
// In Phase 2 this base path will point at apps/api — override via VITE_API_BASE.
const BASE = import.meta.env.VITE_API_BASE ?? '/api'

export async function fetchWaterQuality(limit = 500): Promise<RawResponse> {
  const res = await fetch(`${BASE}/json/WPOSInformationTime/1/${limit}/`)
  if (!res.ok) {
    throw new Error(`서울 Open API 호출 실패: HTTP ${res.status}`)
  }
  const data = (await res.json()) as RawResponse
  const result = data.WPOSInformationTime?.RESULT
  if (result && result.CODE !== 'INFO-000') {
    throw new Error(`API 에러 ${result.CODE}: ${result.MESSAGE}`)
  }
  return data
}
