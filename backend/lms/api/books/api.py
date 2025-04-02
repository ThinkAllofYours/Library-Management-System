from fastapi import APIRouter
from lms.api.books.scrap import scrape_aladin_book
from lms.broker import broker
from pydantic import BaseModel

router = APIRouter(prefix="/api/books", tags=["books"])


@router.get("/")
async def get_books():
    return {"message": "Hello, World!"}


########################################################
# Display
# 책 목록 조회
########################################################


@router.get("/")
async def get_displays():
    return {"message": "Hello, World!"}


########################################################
# View
# 책 상세 조회
########################################################


@router.get("/{id}")
async def get_view(id: str):
    return {"message": "Hello, World!"}


########################################################
# Create
########################################################


@router.post("/{id}")
async def create_book(id: str):
    return {"message": "Hello, World!"}


########################################################
# Update
########################################################


@router.put("/{id}")
async def update_book(id: str):
    return {"message": "Hello, World!"}


########################################################
# Delete
########################################################


@router.delete("/{id}")
async def delete_book(id: str):
    return {"message": "Hello, World!"}


########################################################
# get book info from url
########################################################


class ScrapeBookInfoRequest(BaseModel):
    url: str


@router.post("/books/scrape")
async def get_book_info_from_url(request: ScrapeBookInfoRequest):
    """
    책 목록 스크랩 해오기
    Args:
        url: 책 정보를 가져올 웹사이트 주소
        현재는 알라딘만 구현
        ex) url = "https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=890127258X"
    """
    # url이 https://www.aladin.co.kr로 시작하면 알라딘 책 정보 가져오기
    book_info = None
    if request.url.startswith("https://www.aladin.co.kr"):
        author_info, book_info = scrape_aladin_book(request.url)
        # 책 정보를 저장하는 broker task에 책 정보 저장
        if book_info:
            await broker.enqueue_book_info(author_info, book_info)

    return {"status": "success", "message": "Book information processing started"}
