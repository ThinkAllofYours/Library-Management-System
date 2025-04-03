import uuid

import pytest
from lms.api.authors.model import Author
from lms.api.books.model import Book
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


def test_author_model_structure():
    """Author 모델 구조 테스트"""
    # Author 모델의 __tablename__ 확인
    assert Author.__tablename__ == "authors"

    # 필드 확인
    assert hasattr(Author, "id")
    assert hasattr(Author, "name")
    assert hasattr(Author, "description")
    assert hasattr(Author, "created")
    assert hasattr(Author, "modified")
    assert hasattr(Author, "books")


def test_book_model_structure():
    """Book 모델 구조 테스트"""
    # Book 모델의 __tablename__ 확인
    assert Book.__tablename__ == "books"

    # 필드 확인
    assert hasattr(Book, "id")
    assert hasattr(Book, "book_manage_id")
    assert hasattr(Book, "title")
    assert hasattr(Book, "author_id")
    assert hasattr(Book, "author_rel")
    assert hasattr(Book, "isbn")
    assert hasattr(Book, "description")
    assert hasattr(Book, "price")
    assert hasattr(Book, "quantity")
    assert hasattr(Book, "page_count")
    assert hasattr(Book, "dimensions")
    assert hasattr(Book, "weight")
    assert hasattr(Book, "_cover_image")
    assert hasattr(Book, "cover_image")
    assert hasattr(Book, "table_of_contents")
    assert hasattr(Book, "introduction")
    assert hasattr(Book, "publisher_image")
    assert hasattr(Book, "created")
    assert hasattr(Book, "modified")


# 세션 스코프의 이벤트 루프 사용
@pytest.mark.asyncio(loop_scope="function")
async def test_author_book_relationship(async_session: AsyncSession):
    """Author와 Book 간의 관계 테스트"""
    # 트랜잭션 시작
    async with async_session.begin():
        # 저자 생성
        author = Author(name="테스트 저자", description="테스트 저자 설명")

        # 세션에 저자 추가
        async_session.add(author)
        # flush로 ID 생성
        await async_session.flush()

        # 저자 ID가 유효한 문자열인지 검증
        assert isinstance(author.id, str)
        assert len(author.id) > 0

        # 책 생성
        book = Book(
            book_manage_id="TEST_123",
            title="테스트 도서",
            author_id=author.id,  # 문자열 형태의 ID
            isbn="1234567890123",
            description="테스트 도서 설명",
            price=15000.0,
            quantity=10,
        )

        # 세션에 책 추가
        async_session.add(book)

    # 별도 트랜잭션으로 데이터 조회 및 관계 검증 (명시적으로 관계 로딩)
    async with async_session.begin():
        # 저자 조회 - 명시적으로 books 관계 로드
        stmt = select(Author).options(selectinload(Author.books)).filter(Author.name == "테스트 저자")
        result = await async_session.execute(stmt)
        saved_author = result.scalar_one()

        # 책 조회 - 명시적으로 author_rel 관계 로드
        stmt = select(Book).options(selectinload(Book.author_rel)).filter(Book.isbn == "1234567890123")
        result = await async_session.execute(stmt)
        saved_book = result.scalar_one()

        # 관계 검증
        assert saved_book.author_id == saved_author.id
        assert saved_book.author_rel.id == saved_author.id
        assert saved_book.author_rel.name == "테스트 저자"

        # 저자의 책 관계 검증 - 이제 books는 이미 로드되어 있음
        assert len(saved_author.books) == 1
        assert saved_author.books[0].id == saved_book.id
        assert saved_author.books[0].title == "테스트 도서"


def test_book_author_id_type():
    """Book 모델의 author_id 필드 타입 검증"""
    # 테스트용 문자열 ID 생성
    author_id = str(uuid.uuid4())

    # 책 인스턴스 생성 시 author_id에 문자열 전달
    book = Book(
        book_manage_id="TEST_123",
        title="테스트 도서",
        author_id=author_id,
        isbn="1234567890123",
        description="테스트 도서 설명",
        price=15000.0,
        quantity=10,
    )

    # author_id가 동일한 문자열로 설정되었는지 확인
    assert book.author_id == author_id
    assert isinstance(book.author_id, str)
