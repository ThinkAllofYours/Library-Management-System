import logging
from typing import Any, Dict, Optional

import redis.asyncio as redis
from lms.api.authors.model import Author
from lms.api.books.model import Book
from lms.base.storage import S3Client
from lms.config import settings
from lms.database import AsyncSessionLocal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from taskiq_redis import RedisAsyncResultBackend, RedisStreamBroker

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 결과 백엔드 설정
result_backend = RedisAsyncResultBackend(settings.REDIS_URL)

# Redis 브로커 설정
broker = RedisStreamBroker(url=settings.REDIS_URL).with_result_backend(result_backend)

# Redis 클라이언트
redis_client = None

# 큐 이름
BOOK_INFO_QUEUE = "book_info_queue"

# S3 클라이언트
s3_client = S3Client()


async def get_redis_client():
    """Redis 클라이언트 가져오기"""
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        logger.info("Redis 연결 설정 완료")
    return redis_client


@broker.task(task_name="process_book_info")
async def process_book_info_task(author_info: Dict[str, Any], book_info: Dict[str, Any]):
    """책 정보 처리 작업"""
    try:
        logger.info("세션 연결 시작")
        session = AsyncSessionLocal()
        try:
            logger.info(f"세션 연결 성공: {session}")
            return await save_book_info(author_info, book_info, session)
        finally:
            await session.close()
    except Exception as e:
        logger.error(f"태스크 실행 중 오류 발생: {str(e)}")
        raise


async def save_book_info(
    author_info: Dict[str, Any], book_info: Dict[str, Any], session: AsyncSession
) -> Optional[Dict[str, Any]]:
    """도서 정보와 저자 정보를 데이터베이스에 저장"""
    try:
        # ISBN 확인
        isbn = book_info.get("isbn")
        if not isbn:
            logger.error("도서 정보에 ISBN이 없음")
            return None

        # 저자 정보 저장 또는 업데이트
        author_name = author_info.get("name")
        if not author_name:
            logger.error("저자 정보에 이름이 없음")
            return None

        # 이미지 URL 처리 - cover_image는 모델의 setter를 사용하지 않고 직접 _cover_image 설정
        if "_cover_image" in book_info and book_info["_cover_image"].startswith(("http://", "https://")):
            downloaded_url = await s3_client.download_image_from_url(book_info["_cover_image"], "media/cover")
            logger.info(f"downloaded_url: {downloaded_url}")
            book_info["_cover_image"] = downloaded_url

        if "publisher_image" in book_info and book_info["publisher_image"].startswith(("http://", "https://")):
            downloaded_url = await s3_client.download_image_from_url(book_info["publisher_image"], "media/publisher")
            book_info["publisher_image"] = downloaded_url

        # 저자 조회
        author_query = select(Author).where(Author.name == author_name)
        result = await session.execute(author_query)
        author = result.scalar_one_or_none()

        if not author:
            # 새 저자 생성
            author = Author(**author_info)
            session.add(author)
            await session.flush()  # ID 생성을 위해 flush
        else:
            for key, value in author_info.items():
                if hasattr(author, key) and value is not None:
                    setattr(author, key, value)

        # 도서 조회 및 생성/업데이트
        book_query = select(Book).where(Book.isbn == isbn)
        result = await session.execute(book_query)
        existing_book = result.scalar_one_or_none()

        if existing_book:
            # 기존 도서 정보 업데이트
            for key, value in book_info.items():
                if hasattr(existing_book, key) and value is not None:
                    setattr(existing_book, key, value)
            # 저자 연결
            existing_book.author_id = str(author.id)
            book = existing_book
        else:
            # 새 도서 생성
            book_info["author_id"] = str(author.id)
            book = Book(**book_info)
            session.add(book)

        await session.commit()

        logger.info(f"도서 정보와 저자 정보 저장 완료. ISBN: {isbn}, 저자: {author_name}")
        return {
            "success": True,
            "author_id": str(author.id),
            "author_name": author.name,
            "book_id": str(book.id),
            "book_title": book.title,
            "isbn": book.isbn,
        }

    except Exception as e:
        logger.error(f"도서 정보 저장 오류: {str(e)}")
        return {"success": False, "error": str(e)}
