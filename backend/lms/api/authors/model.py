from lms.base.model import IdBase, TimestampedMixin
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Author(TimestampedMixin, IdBase):
    __tablename__ = "authors"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    books = relationship("Book", back_populates="author_rel")
