import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from lms.api.books.model import Author
from lms.broker import BOOK_INFO_QUEUE, broker


@pytest.fixture
def mock_redis():
    """Redis 연결을 모킹하는 fixture"""
    mock_redis_instance = AsyncMock()

    # 실제 Redis 클라이언트의 close 메서드 모킹
    mock_redis_instance.close = AsyncMock()

    # broker 객체가 redis 속성으로 mock 객체를 사용하도록 설정
    broker.redis = mock_redis_instance
    yield mock_redis_instance
    broker.redis = None


@pytest.fixture
def sample_author_info():
    """테스트용 저자 정보"""
    return {"name": "테스트 저자", "description": "테스트 저자 설명"}


@pytest.fixture
def sample_book_info():
    """테스트용 도서 정보"""
    return {"isbn": "890127258X", "title": "테스트 도서", "description": "테스트 설명", "price": 15000, "quantity": 10}


@pytest.mark.asyncio
async def test_init_redis():
    """Redis 초기화 테스트"""
    # 테스트를 위해 초기 상태 설정
    broker.redis = None

    # Redis 클라이언트 패치
    with patch("redis.asyncio.from_url") as mock_redis_factory:
        mock_redis_instance = AsyncMock()
        mock_redis_factory.return_value = mock_redis_instance

        await broker.init_redis()
        assert broker.redis is not None
        mock_redis_instance.close.assert_not_called()


@pytest.mark.asyncio
async def test_close_redis(mock_redis):
    """Redis 연결 종료 테스트"""
    await broker.close_redis()
    assert broker.redis is None
    mock_redis.close.assert_called_once()


@pytest.mark.asyncio
async def test_enqueue_book_info(mock_redis, sample_author_info, sample_book_info):
    """도서 정보와 저자 정보 큐 추가 테스트"""
    await broker.enqueue_book_info(sample_author_info, sample_book_info)

    expected_data = {"author_info": sample_author_info, "book_info": sample_book_info}

    mock_redis.lpush.assert_called_once_with(BOOK_INFO_QUEUE, json.dumps(expected_data))


@pytest.mark.asyncio
async def test_process_book_info_queue(mock_redis, sample_author_info, sample_book_info):
    """도서 정보 대기열 처리 테스트"""
    # 테스트 데이터 설정
    queue_data = {"author_info": sample_author_info, "book_info": sample_book_info}

    # Redis에서 반환할 데이터 설정
    mock_redis.rpop.side_effect = [
        json.dumps(queue_data),  # 첫 번째 호출에서 데이터 반환
        None,  # 두 번째 호출에서 큐가 비어있음을 시뮬레이션
    ]

    # save_book_info 모킹
    original_save_book_info = broker.save_book_info
    broker.save_book_info = AsyncMock()

    try:
        # 테스트 세션 생성
        mock_session = MagicMock()

        # 함수 호출
        await broker.process_book_info_queue(mock_session)

        # 검증
        assert mock_redis.rpop.call_count == 2
        broker.save_book_info.assert_called_once_with(sample_author_info, sample_book_info, mock_session)
    finally:
        # 원래 메서드 복원
        broker.save_book_info = original_save_book_info


@pytest.mark.asyncio
async def test_save_book_info(sample_author_info, sample_book_info):
    """도서 정보와 저자 정보 저장 테스트"""
    # DB 세션 모킹
    mock_session = MagicMock()

    # Author 모델 모킹
    mock_author = MagicMock(spec=Author)
    mock_author.id = "1"  # 문자열 ID

    # 세션 쿼리 체인 모킹
    mock_query = MagicMock()
    mock_session.query.return_value = mock_query

    mock_filter = MagicMock()
    mock_query.filter.return_value = mock_filter

    # 저자 없음, 새 도서 시나리오 설정
    mock_filter.first.side_effect = [None, None]  # 저자와 도서 모두 없음

    # 테스트 실행
    with patch.object(mock_session, "add") as mock_add, patch.object(
        mock_session, "flush"
    ) as mock_flush, patch.object(mock_session, "commit") as mock_commit, patch.object(
        mock_session, "rollback"
    ) as mock_rollback:

        result = await broker.save_book_info(sample_author_info, sample_book_info, mock_session)

        # 검증
        assert mock_add.call_count == 2  # 저자와 도서 모두 추가됨
        mock_flush.assert_called_once()
        mock_commit.assert_called_once()
        mock_rollback.assert_not_called()

    # 예외 케이스 테스트 - ISBN 없음
    invalid_book_info = {"title": "No ISBN Book"}
    result = await broker.save_book_info(sample_author_info, invalid_book_info, mock_session)
    assert result is None

    # 예외 케이스 테스트 - 저자 이름 없음
    invalid_author_info = {"description": "No Name Author"}
    result = await broker.save_book_info(invalid_author_info, sample_book_info, mock_session)
    assert result is None
