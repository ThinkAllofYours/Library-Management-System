import re
from typing import Any, Dict, Tuple

import requests
from bs4 import BeautifulSoup


# pyright: ignore[reportUnusedFunction]
def scrape_aladin_book(url: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    알라딘 웹사이트에서 책 정보를 스크래핑

    Args:
        url (str): 알라딘 책 페이지 URL

    Returns:
        Tuple[Dict[str, Any], Dict[str, Any]]: (author_info, book_info) 튜플
    """
    try:
        # 브라우저 요청을 모방하기 위한 헤더 설정
        # flake8: noqa: E501
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        }

        # URL에 GET 요청 보내기
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # HTTP 오류 발생 시 예외 처리

        # HTML 내용 파싱
        soup = BeautifulSoup(response.text, "html.parser")

        # 제목 추출
        title_element = soup.find("meta", property="og:title")
        title = title_element["content"].replace(" : 알라딘", "").strip() if title_element else "Unknown Title"

        # ISBN 추출
        isbn_element = soup.find("meta", property="books:isbn")
        isbn = isbn_element["content"] if isbn_element else "Unknown ISBN"

        # 저자 추출
        author_element = soup.find("meta", property="og:author")
        author_name = author_element["content"] if author_element else "Unknown Author"

        # 설명 추출
        description_element = soup.find("meta", property="og:description")
        description = description_element["content"] if description_element else ""

        # 가격 추출
        price_element = soup.find("meta", property="og:price")
        price = float(price_element["content"]) if price_element else 0.0

        # 표지 이미지 추출
        cover_image_element = soup.find("meta", property="og:image")
        cover_image_url = cover_image_element["content"] if cover_image_element else ""

        # 추가 도서 세부 정보
        # 페이지 수 추출
        page_count = None
        page_count_element = soup.select_one('.conts_info_list1 li:-soup-contains("쪽")')
        if page_count_element:
            page_count_text = page_count_element.get_text()
            page_count_match = re.search(r"(\d+)쪽", page_count_text)
            if page_count_match:
                page_count = int(page_count_match.group(1))

        # 책 크기 추출
        dimensions = None
        dimensions_element = soup.select_one('.conts_info_list1 li:-soup-contains("mm")')
        if dimensions_element:
            dimensions = dimensions_element.get_text().strip()

        # 무게 추출
        weight = None
        weight_element = soup.select_one('.conts_info_list1 li:-soup-contains("g")')
        if weight_element:
            weight_text = weight_element.get_text()
            weight_match = re.search(r"(\d+)g", weight_text)
            if weight_match:
                weight = float(weight_match.group(1))

        # ISBN을 찾지 못한 경우 HTML 구조에서 추출 시도
        if isbn == "Unknown ISBN":
            isbn_element = soup.select_one('.conts_info_list1 li:-soup-contains("ISBN")')
            if isbn_element:
                isbn_text = isbn_element.get_text()
                isbn_match = re.search(r"ISBN\s*:\s*(\d+)", isbn_text)
                if isbn_match:
                    isbn = isbn_match.group(1)

        # 목차 추출
        table_of_contents = None

        # 소개 추출
        introduction = None

        # 출판사 이미지 추출 = 표지 이미지
        publisher_image = cover_image_url

        # 저자 정보 딕셔너리 생성
        author_info = {"name": author_name, "description": None}  # 알라딘에서 저자 설명을 가져올 수 없는 경우

        # 책 정보 딕셔너리 생성
        book_info = {
            "book_manage_id": f"ALADIN_{isbn}",
            "title": title,
            "isbn": isbn,
            "description": description,
            "price": price,
            "quantity": 0,
            "page_count": page_count,
            "dimensions": dimensions,
            "weight": weight,
            "_cover_image": cover_image_url,
            "table_of_contents": table_of_contents,
            "introduction": introduction,
            "publisher_image": publisher_image,
        }

        return author_info, book_info

    except Exception as e:
        print(f"책 정보 스크래핑 중 오류 발생: {e}")
        return None, None
