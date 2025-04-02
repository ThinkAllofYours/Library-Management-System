from unittest.mock import Mock, patch

import pytest
from lms.api.books.scrap import scrape_aladin_book


@pytest.fixture
def mock_response():
    """HTML 응답을 모킹하는 fixture"""
    mock_resp = Mock()

    # HTML 파일에서 테스트 데이터 로드 - 여기서는 예시 HTML 문자열 사용
    with open("backend/tests/book/mock_aladin_page.html", "r", encoding="utf-8") as f:
        mock_resp.text = f.read()

    mock_resp.raise_for_status = Mock()
    return mock_resp


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
async def test_scrape_aladin_book(sample_html_content):
    """알라딘 책 스크래핑 함수 테스트"""

    # requests.get 호출을 모킹
    with patch("requests.get") as mock_get:
        # 응답 모킹
        mock_response = Mock()
        mock_response.text = sample_html_content
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        # 함수 호출
        url = "https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=890127258X"
        author_info, book_info = scrape_aladin_book(url)

        # 기본 검증
        assert author_info is not None, "저자 정보 스크래핑 실패"
        assert book_info is not None, "책 정보 스크래핑 실패"

        # 저자 정보 검증
        assert author_info["name"] == "테스트 저자"

        # 책 정보 검증
        assert book_info["title"] == "테스트 도서"
        assert book_info["isbn"] == "890127258X"
        assert book_info["description"] == "테스트 도서 설명입니다."
        assert book_info["price"] == 15000.0
        assert book_info["_cover_image"] == "https://example.com/cover.jpg"
        assert book_info["page_count"] == 300
        assert "dimensions" in book_info
        assert book_info["weight"] == 500.0
        assert book_info["table_of_contents"] == "테스트 목차입니다."
        assert book_info["introduction"] == "테스트 소개입니다."
        assert book_info["publisher_image"] == "https://example.com/publisher.jpg"


@pytest.mark.asyncio
async def test_scrape_aladin_book_error():
    """알라딘 책 스크래핑 예외 처리 테스트"""

    # requests.get이 예외를 발생시키도록 설정
    with patch("requests.get", side_effect=Exception("Mock 예외")):
        url = "https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=890127258X"
        author_info, book_info = scrape_aladin_book(url)

        # 예외 시 None 반환 확인
        assert author_info is None
        assert book_info is None
