import json
import logging
from contextlib import asynccontextmanager
from typing import Any, Dict, Optional, Tuple

import redis.asyncio as redis
from lms.api.books.model import Author, Book
from lms.config import settings
from sqlalchemy.orm import Session

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 큐 이름
BOOK_INFO_QUEUE = "book_info_queue"
BOOK_UPDATE_QUEUE = "book_update_queue"


class RedisBroker:
    def __init__(self):
        self.redis = None

    async def init_redis(self):
        """Redis 연결 초기화"""
        if self.redis is None:
            self.redis = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
            logger.info("Redis 연결 설정 완료")

    async def close_redis(self):
        """Redis 연결 종료"""
        if self.redis:
            await self.redis.close()
            self.redis = None
            logger.info("Redis 연결 종료")

    @asynccontextmanager
    async def get_redis(self):
        """Redis 작업을 위한 컨텍스트 매니저"""
        if self.redis is None:
            await self.init_redis()
        try:
            yield self.redis
        finally:
            pass  # 연결 유지

    async def enqueue_book_info(self, author_info: Dict[str, Any], book_info: Dict[str, Any]):
        """도서 정보와 저자 정보를 처리 대기열에 추가"""
        async with self.get_redis() as redis_conn:
            data = {"author_info": author_info, "book_info": book_info}
            await redis_conn.lpush(BOOK_INFO_QUEUE, json.dumps(data))
            logger.info(f"도서 정보와 저자 정보가 대기열에 추가됨. ISBN: {book_info.get('isbn')}")

    async def process_book_info_queue(self, session: Session):
        """대기열에서 도서 정보와 저자 정보 처리"""
        async with self.get_redis() as redis_conn:
            while True:
                try:
                    # 대기열에서 다음 항목 가져오기
                    item = await redis_conn.rpop(BOOK_INFO_QUEUE)
                    if not item:
                        break

                    data = json.loads(item)
                    author_info = data.get("author_info")
                    book_info = data.get("book_info")

                    if not author_info or not book_info:
                        logger.error("유효하지 않은 데이터 형식: author_info 또는 book_info 누락")
                        continue

                    await self.save_book_info(author_info, book_info, session)
                    logger.info(f"도서 정보와 저자 정보 처리 완료. ISBN: {book_info.get('isbn')}")
                except json.JSONDecodeError as e:
                    logger.error(f"대기열에 유효하지 않은 JSON 형식: {str(e)}")
                    continue
                except Exception as e:
                    logger.error(f"도서 정보 처리 오류: {str(e)}")
                    break

    async def save_book_info(
        self, author_info: Dict[str, Any], book_info: Dict[str, Any], session: Session
    ) -> Optional[Tuple[Author, Book]]:
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

            # 저자 조회 및 생성/업데이트
            author = session.query(Author).filter(Author.name == author_name).first()
            if not author:
                # 새 저자 생성
                author = Author(**author_info)
                session.add(author)
                session.flush()  # ID 생성을 위해 flush
            else:
                # 기존 저자 업데이트
                for key, value in author_info.items():
                    if hasattr(author, key) and value is not None:
                        setattr(author, key, value)

            # 도서 조회 및 생성/업데이트
            existing_book = session.query(Book).filter(Book.isbn == isbn).first()

            if existing_book:
                # 기존 도서 정보 업데이트
                for key, value in book_info.items():
                    if hasattr(existing_book, key) and value is not None:
                        setattr(existing_book, key, value)
                # 저자 연결
                existing_book.author_id = str(author.id)  # 문자열로 변환
                book = existing_book
            else:
                # 새 도서 생성
                book_info["author_id"] = str(author.id)  # 문자열로 변환
                book = Book(**book_info)
                session.add(book)

            session.commit()
            logger.info(f"도서 정보와 저자 정보 저장 완료. ISBN: {isbn}, 저자: {author_name}")
            return author, book

        except Exception as e:
            session.rollback()
            logger.error(f"도서 정보 저장 오류: {str(e)}")
            return None


# 싱글톤 인스턴스 생성
broker = RedisBroker()
