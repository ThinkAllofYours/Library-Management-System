# flake8: noqa
import os

# 테스트 모드 설정 - 다른 import 전에 반드시 필요
# flake8: noqa
os.environ["TEST_MODE"] = "true"

# 기본 Python 패키지
import logging
import os

# 로컬 애플리케이션 패키지 - 명시적으로 경로를 설정합니다
import sys
import threading
import warnings
from typing import AsyncGenerator, Union
from unittest.mock import MagicMock

# 서드파티 패키지
import pytest
import pytest_asyncio
from alembic import command
from alembic.config import Config
from asgi_lifespan import LifespanManager
from httpx import AsyncClient
from httpx._transports.asgi import ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

# 백엔드 디렉토리를 모듈 검색 경로에 추가
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)

from lms.base.model import Base
from lms.base.storage import S3Client, UploadFile
from lms.config import get_settings
from lms.database import get_session
from lms.main import app

# 경고 메시지 억제
warnings.filterwarnings("ignore")


def silence_logging():
    """모든 로깅 비활성화"""
    # 루트 로거 설정
    logging.getLogger().setLevel(logging.CRITICAL)

    # 모든 로거를 찾아서 비활성화
    for logger_name in logging.root.manager.loggerDict:
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.CRITICAL)
        logger.propagate = False
        logger.disabled = True

        # 모든 핸들러 제거
        if logger.handlers:
            for handler in logger.handlers[:]:
                logger.removeHandler(handler)

    # 기본 로깅 설정을 무효화
    logging.basicConfig(handlers=[logging.NullHandler()], level=logging.CRITICAL)


# 로깅 비활성화 실행
silence_logging()

# 테스트용 데이터베이스 엔진 생성
test_engine = create_async_engine(
    get_settings().TEST_DATABASE_URL,
    echo=False,
    future=True,
    poolclass=NullPool,
)

# 테스트용 세션 팩토리 생성 - async_sessionmaker 사용
TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database() -> AsyncGenerator:
    """
    Alembic을 사용하여 테스트 데이터베이스 설정 및 마이그레이션 적용을 관리하는 픽스처
    """
    # Alembic 설정 파일 경로 지정
    alembic_cfg = Config("alembic.ini")

    def run_migrations():
        """동기 Alembic 마이그레이션을 호출하는 함수"""
        command.upgrade(alembic_cfg, "head")

    # 데이터베이스 초기화 및 마이그레이션 적용
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    # 동기 마이그레이션을 별도의 스레드에서 실행
    migration_thread = threading.Thread(target=run_migrations)
    migration_thread.start()
    migration_thread.join()

    yield

    # 테스트 종료 후 데이터베이스 초기화
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    테스트에서 사용할 비동기 데이터베이스 세션 픽스처
    """
    # 기존 세션 옵션을 사용하지만 autocommit/autoflush 활성화하여 예기치 않은 지연 로딩 문제 방지
    session_factory = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=True,  # autoflush를 True로 설정
    )

    async with session_factory() as session:
        try:
            yield session
            await session.commit()  # 성공 시 커밋
        except Exception:
            await session.rollback()  # 실패 시 롤백
            raise


@pytest_asyncio.fixture
async def client(async_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    AsyncClient 픽스처 - 실제 서버 대신 앱을 직접 테스트
    """

    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        yield async_session

    app.dependency_overrides[get_session] = override_get_session

    async with LifespanManager(app):
        # ASGITransport를 사용하여 app을 테스트
        async with AsyncClient(
            base_url="http://test/api/v2", transport=ASGITransport(app=app)  # app 대신 transport 사용
        ) as ac:
            yield ac

    app.dependency_overrides.clear()


@pytest.fixture(scope="session", autouse=True)
def mock_s3_client():
    """Mock S3 클라이언트 fixture"""
    mock_client = MagicMock(spec=S3Client)

    # set_file 메서드 모킹
    def mock_set_file(
        current_url: str, new_file: Union[UploadFile, str, None], path_prefix: str, optimize: bool = False
    ) -> str:
        # URL 형식이면 그대로 반환
        if isinstance(new_file, str):
            return new_file

        # UploadFile 처리
        if new_file and isinstance(new_file, UploadFile):
            # 파일명이 있는 경우 mock URL 생성
            if hasattr(new_file, "filename"):
                mock_file_url = f"{path_prefix}/{new_file.filename}"
                # upload_file이 이 URL을 반환하도록 설정
                mock_client.upload_file.return_value = mock_file_url
                # upload_file 호출
                return mock_client.upload_file(new_file, path_prefix)

        # 빈 값이거나 None인 경우
        return ""

    # upload_file 메서드 모킹
    def mock_upload_file(file: UploadFile, path_prefix: str) -> str:
        # 실제 파일 업로드를 시뮬레이션하고 성공했다고 가정
        if file and hasattr(file, "filename"):
            return f"{path_prefix}/{file.filename}"
        return ""

    # delete_file 메서드 모킹
    def mock_delete_file(file_key: str) -> bool:
        # 파일 삭제 성공을 시뮬레이션
        return True

    # 각 메서드에 대한 mock 설정
    mock_client.set_file = MagicMock(side_effect=mock_set_file)
    mock_client.upload_file = MagicMock(side_effect=mock_upload_file)
    mock_client.delete_file = MagicMock(side_effect=mock_delete_file)

    # 실제 S3Client를 mock으로 대체
    from lms.base.storage import s3_client as original_client

    # 임시로 원본 저장
    temp_original = original_client

    # mock으로 교체
    from lms.base import storage

    storage.s3_client = mock_client

    yield mock_client

    # 테스트 종료 후 원래 클라이언트로 복구
    storage.s3_client = temp_original
