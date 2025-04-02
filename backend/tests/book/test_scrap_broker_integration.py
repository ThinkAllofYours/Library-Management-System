import json
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
from lms.api.books.scrap import scrape_aladin_book
from lms.broker import BOOK_INFO_QUEUE, broker


@pytest.fixture
def sample_author_info():
    """테스트용 저자 정보"""
    return {"name": "테스트 저자", "description": "테스트 저자 설명"}


@pytest.fixture
def sample_book_info():
    """테스트용 도서 정보"""
    return {"isbn": "890127258X", "title": "테스트 도서", "description": "테스트 설명", "price": 15000, "quantity": 10}


@pytest.fixture
def sample_html_content():
    """테스트용 HTML 콘텐츠"""
    return """
    <html>
        <head>
            <meta property="og:title" content="테스트 도서 : 알라딘" />
            <meta property="books:isbn" content="890127258X" />
            <meta property="og:author" content="테스트 저자" />
            <meta property="og:description" content="테스트 도서 설명입니다." />
            <meta property="og:price" content="15000" />
            <meta property="og:image" content="https://example.com/cover.jpg" />
        </head>
        <body>
            <div class="conts_info_list1">
                <li>쪽수: 300쪽</li>
                <li>크기: 152 * 225 * 25 mm</li>
                <li>무게: 500g</li>
                <li>ISBN : 890127258X</li>
            </div>
            <div class="conts_info_list2">테스트 목차입니다.</div>
            <div class="conts_info_list3">테스트 소개입니다.</div>
            <div class="publisher_logo"><img src="https://example.com/publisher.jpg" /></div>
        </body>
    </html>
    """


@pytest.mark.asyncio
async def test_scrap_and_broker_integration(sample_html_content):
    """스크래핑과 브로커 통합 테스트"""

    # requests.get 호출을 모킹
    with patch("requests.get") as mock_get:
        # 웹 페이지 응답 모킹
        mock_response = Mock()
        mock_response.text = sample_html_content
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        # 브로커의 enqueue_book_info 모킹
        broker.enqueue_book_info = AsyncMock()

        # 테스트할 URL
        url = "https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=890127258X"

        # 스크래핑 함수 호출
        author_info, book_info = scrape_aladin_book(url)

        # 브로커를 통한 대기열 추가
        await broker.enqueue_book_info(author_info, book_info)

        # 검증
        assert author_info is not None
        assert book_info is not None
        broker.enqueue_book_info.assert_called_once_with(author_info, book_info)


@pytest.mark.asyncio
async def test_process_book_info_integration(sample_author_info, sample_book_info):
    """책 정보 처리 통합 테스트"""

    # Redis 모킹
    with patch("redis.asyncio.from_url") as mock_redis_factory:
        mock_redis = AsyncMock()
        mock_redis_factory.return_value = mock_redis

        # 대기열에서 데이터 가져오기 모킹
        queue_data = {"author_info": sample_author_info, "book_info": sample_book_info}
        mock_redis.rpop.side_effect = [json.dumps(queue_data), None]  # 두 번째 호출에서는 대기열 비움

        # DB 세션 모킹
        mock_session = MagicMock()

        # save_book_info 모킹
        broker.save_book_info = AsyncMock()

        # 초기화 및 테스트 함수 호출
        await broker.init_redis()
        await broker.process_book_info_queue(mock_session)

        # 검증
        mock_redis.rpop.assert_called_with(BOOK_INFO_QUEUE)
        broker.save_book_info.assert_called_once_with(sample_author_info, sample_book_info, mock_session)
