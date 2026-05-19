"""Seoul Open API 클라이언트 + 정규화 — apps/web/src/lib/{api,normalize}.ts 와 1:1 대응."""

from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from .models import NormalizedRow

KST = timezone(timedelta(hours=9))
SEOUL_BASE = "http://openapi.seoul.go.kr:8088"
SERVICE = "WPOSInformationTime"


def parse_numeric(v: Any) -> float | None:
    """`"점검중"` / 빈 문자열 / 변환 불가 → None. 그 외 float."""
    if v is None:
        return None
    s = str(v).strip()
    if s == "" or s == "점검중":
        return None
    try:
        f = float(s)
    except (TypeError, ValueError):
        return None
    if f != f or f in (float("inf"), float("-inf")):  # NaN/Inf 차단
        return None
    return f


def parse_timestamp(ymd: str, hr: str) -> datetime | None:
    """`YMD='20260519'`, `HR='09:00'` → KST datetime.

    실데이터 관찰: 일부 row의 `HR`이 `"24:00"` (자정 = 다음 날 00:00)으로 오는
    경우가 있어 ValueError 가 발생한다. 명세에 없는 quirk이지만 안전하게 처리.
    파싱 불가 시 None 반환 → 호출자가 해당 row를 drop.
    """
    if not ymd or not hr or len(ymd) != 8:
        return None
    try:
        date_str = f"{ymd[0:4]}-{ymd[4:6]}-{ymd[6:8]}"
        # 일부 데이터에 24:00이 섞임 — 다음 날 00:00으로 이월
        if hr == "24:00":
            base = datetime.fromisoformat(f"{date_str}T00:00:00+09:00")
            return base + timedelta(days=1)
        return datetime.fromisoformat(f"{date_str}T{hr}:00+09:00")
    except (ValueError, TypeError):
        return None


def _normalize_row(raw: dict[str, Any]) -> NormalizedRow | None:
    ts = parse_timestamp(raw.get("YMD", ""), raw.get("HR", ""))
    if ts is None:
        return None
    return NormalizedRow(
        timestamp=ts,
        station=raw["MSRSTN_NM"],
        watt=parse_numeric(raw.get("WATT")),
        ph=parse_numeric(raw.get("TOT_PH")),
        doO2=parse_numeric(raw.get("TOT_DO")),
        totalN=parse_numeric(raw.get("TOT_N")),
        totalP=parse_numeric(raw.get("TOT_TP")),
        totalOC=parse_numeric(raw.get("TOT_OC")),
        phenol=parse_numeric(raw.get("PHNL")),
        cyanide=parse_numeric(raw.get("CN")),
    )


def normalize_rows(raw_response: dict[str, Any]) -> list[NormalizedRow]:
    rows = raw_response.get(SERVICE, {}).get("row", [])
    normalized = [n for r in rows if (n := _normalize_row(r)) is not None]
    normalized.sort(key=lambda r: r.timestamp)
    return normalized


def latest_per_station(rows: list[NormalizedRow]) -> list[NormalizedRow]:
    """측정소별 최신 1건만. station 이름 가나다 순 정렬."""
    by_station: dict[str, NormalizedRow] = {}
    for r in rows:
        existing = by_station.get(r.station)
        if existing is None or r.timestamp > existing.timestamp:
            by_station[r.station] = r
    return sorted(by_station.values(), key=lambda r: r.station)


async def fetch_water_quality(api_key: str, limit: int = 500) -> dict[str, Any]:
    """Seoul Open API 호출. RESULT.CODE 가 INFO-000 이 아니면 raise."""
    url = f"{SEOUL_BASE}/{api_key}/json/{SERVICE}/1/{limit}/"
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url)
    resp.raise_for_status()
    data = resp.json()
    result = data.get(SERVICE, {}).get("RESULT", {})
    code = result.get("CODE")
    if code != "INFO-000":
        msg = result.get("MESSAGE", "unknown")
        raise RuntimeError(f"Seoul API error {code}: {msg}")
    return data
