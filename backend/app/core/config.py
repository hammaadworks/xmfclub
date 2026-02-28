from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, computed_field
from pydantic_core import MultiHostUrl

class Settings(BaseSettings):
    PROJECT_NAME: str = "xmfclub-backend"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "xmfclub"
    POSTGRES_PORT: int = 5432

    # JWT Authentication Settings
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE_CHANGE_IN_PRODUCTION" # Must match Better Auth Secret
    ALGORITHM: str = "HS256"

    # Razorpay Settings
    RAZORPAY_KEY_ID: str = "YOUR_RAZORPAY_KEY_ID"
    RAZORPAY_KEY_SECRET: str = "YOUR_RAZORPAY_KEY_SECRET"
    RAZORPAY_WEBHOOK_SECRET: str = "YOUR_RAZORPAY_WEBHOOK_SECRET"

    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        return MultiHostUrl.build(
            scheme="postgresql+asyncpg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

settings = Settings()
