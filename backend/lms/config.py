from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    APP_NAME: str = "Library Manager System"
    DEBUG: bool = False
    DATABASE_URL: str = "postgresql+asyncpg://lms:lms@localhost:5433/lms"
    SECRET_KEY: str = "secret"

    TIME_ZONE: str = "Asia/Seoul"

    # server
    ALLOW_ORIGINS: List[str] = ["http://localhost:3000"]

    # opensearch
    OPENSEARCH_HOSTS: List[str] = ["localhost:9200"]

    # test
    TEST_DATABASE_URL: str = "postgresql+asyncpg://lms:lms@localhost:5433/test_db"
    TEST_MODE: bool = False

    # redis
    REDIS_URL: str = "redis://redis:6379/0"

    # storage
    AWS_ACCESS_KEY_ID: str = "library.manager"
    AWS_SECRET_ACCESS_KEY: str = "library.manager.dev"
    AWS_STORAGE_BUCKET_NAME: str = "lms"
    AWS_S3_ENDPOINT_URL: str = "http://storage:9000"
    # endpoint for client
    AWS_S3_CLIENT_ENDPOINT_URL: str = "http://localhost:9000"
    AWS_S3_CLIENT_URL_BASE: str = "http://localhost:9000/lms"  # path style url


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()
