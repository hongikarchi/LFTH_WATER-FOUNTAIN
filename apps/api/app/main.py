from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import measurements
from .settings import settings

app = FastAPI(
    title="LFTH Water Fountain API",
    description="Seoul 한강 수질 Open API 프록시 + 정규화된 REST 엔드포인트 (Phase 2)",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(measurements.router)


@app.get("/healthz", tags=["meta"])
def healthz() -> dict[str, str]:
    return {"status": "ok"}
