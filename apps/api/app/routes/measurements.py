from fastapi import APIRouter, HTTPException, Query

from ..models import NormalizedRow
from ..seoul_api import (
    fetch_water_quality,
    latest_per_station,
    normalize_rows,
)
from ..settings import settings

router = APIRouter(prefix="/measurements", tags=["measurements"])


@router.get("/latest", response_model=list[NormalizedRow])
async def get_latest() -> list[NormalizedRow]:
    """측정소별 최신 1건 (4 stations). `apps/web`이 이걸 소비하면 normalize/sort 책임이 backend로 이동."""
    try:
        raw = await fetch_water_quality(settings.seoul_api_key, limit=200)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    rows = normalize_rows(raw)
    return latest_per_station(rows)


@router.get("/history", response_model=list[NormalizedRow])
async def get_history(
    limit: int = Query(default=500, ge=1, le=1000, description="페치할 행 수 (Seoul API 1회 1000건 한도)"),
) -> list[NormalizedRow]:
    """시간순 정렬된 정규화 row 전체. 차트/이력 조회용."""
    try:
        raw = await fetch_water_quality(settings.seoul_api_key, limit=limit)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    return normalize_rows(raw)
