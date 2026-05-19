from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    seoul_api_key: str = Field(..., description="서울 열린데이터광장 인증키")
    cors_origins: str = Field(
        default="http://localhost:5173",
        description="쉼표 구분 origin 목록. apps/web dev server 기본 포함.",
    )
    host: str = "127.0.0.1"
    port: int = 8000

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
