from fastapi import UploadFile
from lms.base.model import IdBase, TimestampedMixin
from lms.base.storage import s3_client
from sqlalchemy import Float, ForeignKey, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Author(TimestampedMixin, IdBase):
    __tablename__ = "authors"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    books = relationship("Book", back_populates="author_rel")


class Book(TimestampedMixin, IdBase):
    __tablename__ = "books"

    book_manage_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True, unique=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    author_id: Mapped[str] = mapped_column(String(36), ForeignKey("authors.id"), nullable=False)
    author_rel = relationship("Author", back_populates="books")
    isbn: Mapped[str] = mapped_column(String(13), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Float, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=0)
    page_count: Mapped[int] = mapped_column(Integer, nullable=True)
    dimensions: Mapped[str] = mapped_column(String(50), nullable=True)
    weight: Mapped[float] = mapped_column(Float, nullable=True)
    _cover_image: Mapped[str] = mapped_column(String(255), server_default=text("''"))
    table_of_contents: Mapped[str] = mapped_column(Text, nullable=True)
    introduction: Mapped[str] = mapped_column(Text, nullable=True)
    publisher_image: Mapped[str] = mapped_column(String(255), nullable=True)

    @property
    def cover_image(self) -> str:
        return self._cover_image or ""

    @cover_image.setter
    def cover_image(self, file: UploadFile | str | None = None):
        self._cover_image = s3_client.set_file(self._cover_image, file, "media/cover")
