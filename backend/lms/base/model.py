from datetime import datetime

from nanoid import generate
from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class TimestampedMixin:
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    modified: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Base(DeclarativeBase):
    __abstract__ = True


class IdBase(Base):
    __abstract__ = True

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate(size=12))
