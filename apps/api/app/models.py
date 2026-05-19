"""Domain models — apps/web/src/types/waterQuality.ts 와 1:1 대응.

키명 일치는 apps/web에서 fetch 후 그대로 사용할 수 있게 하기 위함.
'do'는 JS 예약어 회피를 위해 frontend에서 `doO2` 키를 쓰므로 여기서도 동일.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class Measurements(BaseModel):
    watt: float | None = Field(None, description="수온 °C")
    ph: float | None = Field(None, description="pH")
    doO2: float | None = Field(None, description="용존산소 mg/L")
    totalN: float | None = Field(None, description="총질소")
    totalP: float | None = Field(None, description="총인")
    totalOC: float | None = Field(None, description="총유기탄소")
    phenol: float | None = Field(None, description="페놀")
    cyanide: float | None = Field(None, description="시안")


class NormalizedRow(Measurements):
    timestamp: datetime  # ISO 8601 with KST offset
    station: str
