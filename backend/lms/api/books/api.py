from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from lms.api.books.model import Author, Book
from lms.api.books.scrap import scrape_aladin_book
from lms.broker import process_book_info_task
from lms.deps import SessionDep
from lms.util.utils import paginate
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import joinedload

router = APIRouter(prefix="/api/books", tags=["books"])

########################################################
# Schemas
########################################################


class AuthorBase(BaseModel):
    name: str
    description: Optional[str] = None


class AuthorCreate(AuthorBase):
    pass


class AuthorResponse(AuthorBase):
    id: str
    created: datetime
    modified: datetime

    class Config:
        from_attributes = True


class BookBase(BaseModel):
    book_manage_id: str
    title: str
    isbn: str
    description: Optional[str] = None
    price: Optional[float] = None
    quantity: int = 0
    page_count: Optional[int] = None
    dimensions: Optional[str] = None
    weight: Optional[float] = None
    table_of_contents: Optional[str] = None
    introduction: Optional[str] = None
    publisher_image: Optional[str] = None


class BookCreate(BookBase):
    author_id: str


class BookUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    page_count: Optional[int] = None
    dimensions: Optional[str] = None
    weight: Optional[float] = None
    table_of_contents: Optional[str] = None
    introduction: Optional[str] = None
    publisher_image: Optional[str] = None
    author_id: Optional[str] = None
    isbn: Optional[str] = None


class BookResponse(BookBase):
    id: str
    author_id: str
    author: AuthorResponse
    created: datetime
    modified: datetime
    cover_image: str

    class Config:
        from_attributes = True


########################################################
# Common
########################################################


class Pagination(BaseModel):
    page: int = 1
    size: int = 10


########################################################
# Display
# 책 목록 조회
########################################################


class BookFilter(BaseModel):
    author_name: Optional[str] = None
    title: Optional[str] = None


@router.get("/", response_model=List[BookResponse])
async def get_books(session: SessionDep, filter: BookFilter = Depends(), pagination: Pagination = Depends()):
    query = select(Book).options(joinedload(Book.author_rel))

    if filter.author_name:
        query = query.join(Author).where(Author.name.ilike(f"%{filter.author_name}%"))
    if filter.title:
        query = query.where(Book.title.ilike(f"%{filter.title}%"))

    paginated = await paginate(session, query, pagination)
    # author_rel을 author로 매핑
    for book in paginated.items:
        book.author = book.author_rel
    return paginated.items


########################################################
# View
# 책 상세 조회
########################################################


@router.get("/{id}", response_model=BookResponse)
async def get_book(id: str, session: SessionDep):
    query = select(Book).options(joinedload(Book.author_rel)).where(Book.book_manage_id == id)
    result = await session.execute(query)
    book = result.scalar_one_or_none()

    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    else:
        book.author = book.author_rel
    return book


########################################################
# Create
########################################################


@router.post("/", response_model=BookResponse)
async def create_book(book: BookCreate, session: SessionDep):
    # check author exists
    author_query = select(Author).where(Author.id == book.author_id)
    result = await session.execute(author_query)
    author = result.scalar_one_or_none()

    if not author:
        raise HTTPException(status_code=404, detail="Author not found")

    # isbn 중복 체크
    isbn_query = select(Book).where(Book.isbn == book.isbn)
    result = await session.execute(isbn_query)
    isbn_book = result.scalar_one_or_none()

    if isbn_book:
        raise HTTPException(status_code=400, detail="ISBN already exists")

    db_book = Book(**book.model_dump())
    session.add(db_book)
    await session.commit()
    await session.refresh(db_book)

    # author_rel을 author로 매핑
    db_book.author = db_book.author_rel

    return db_book


########################################################
# Update
########################################################


@router.put("/{id}", response_model=BookResponse)
async def update_book(id: str, book_update: BookUpdate, session: SessionDep):
    query = select(Book).options(joinedload(Book.author_rel)).where(Book.book_manage_id == id)
    result = await session.execute(query)
    db_book = result.scalar_one_or_none()

    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")

    if book_update.author_id is not None:
        author_query = select(Author).where(Author.id == book_update.author_id)
        author_result = await session.execute(author_query)
        author = author_result.scalar_one_or_none()
        if not author:
            raise HTTPException(status_code=404, detail="Author not found")

    if book_update.isbn is not None and book_update.isbn != db_book.isbn:
        isbn_query = select(Book).where(Book.isbn == book_update.isbn)
        isbn_result = await session.execute(isbn_query)
        existing_book = isbn_result.scalar_one_or_none()
        if existing_book:
            raise HTTPException(status_code=400, detail="ISBN already exists")

    for field, value in book_update.model_dump(exclude_unset=True).items():
        setattr(db_book, field, value)

    await session.commit()
    await session.refresh(db_book)

    # Map author_rel to author for response
    db_book.author = db_book.author_rel
    return db_book


########################################################
# Delete
########################################################


@router.delete("/{id}")
async def delete_book(id: str, session: SessionDep):
    query = select(Book).where(Book.book_manage_id == id)
    result = await session.execute(query)
    db_book = result.scalar_one_or_none()

    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")

    await session.delete(db_book)
    await session.commit()
    return {"message": "Book deleted successfully"}


########################################################
# get book info from url
########################################################


class ScrapeBookInfoRequest(BaseModel):
    url: str


@router.post("/scrape")
async def get_book_info_from_url(request: ScrapeBookInfoRequest):
    """
    책 목록 스크랩 해오기
    Args:
        url: 책 정보를 가져올 웹사이트 주소
        현재는 알라딘만 구현
        ex) url = "https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=890127258X"
    """
    book_info = None
    if request.url.startswith("https://www.aladin.co.kr"):
        author_info, book_info = scrape_aladin_book(request.url)
        if book_info:
            await process_book_info_task.kiq(author_info=author_info, book_info=book_info)

    return {"status": "success", "message": "Book information processing started"}


########################################################
# Author CRUD
########################################################


@router.post("/authors", response_model=AuthorResponse)
async def create_author(author: AuthorCreate, session: SessionDep):
    db_author = Author(**author.model_dump())
    session.add(db_author)
    await session.commit()
    await session.refresh(db_author)
    return db_author


@router.get("/authors/{id}", response_model=AuthorResponse)
async def get_author(id: str, session: SessionDep):
    query = select(Author).where(Author.id == id)
    result = await session.execute(query)
    author = result.scalar_one_or_none()

    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    return author
