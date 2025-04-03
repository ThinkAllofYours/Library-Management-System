from datetime import datetime, timezone
from typing import Generic, Sequence, TypeVar

from fastapi import Query, Depends
from pydantic import BaseModel
from lms.config import settings
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession



def timezone_now():
    return datetime.now(timezone.utc)


class PaginationParams(BaseModel):
    page: int = Query(1, ge=1)
    size: int = Query(settings.PAGINATION_SIZE, ge=1, le=100)

T = TypeVar("T")

class Paginated(BaseModel, Generic[T]):
    items: Sequence[T]
    total: int
    page: int
    size: int
    pages: int


async def paginate(session: AsyncSession, query, params: PaginationParams = Depends()) -> Paginated:
    page = params.page
    size = params.size

    count_query = query.order_by(None)
    count_query = select(func.count()).select_from(count_query.subquery())

    total = await session.scalar(count_query) or 0
    pages = (total + size - 1) // size

    query = query.offset((page - 1) * size).limit(size)
    result = (await session.execute(query)).unique()

    items = []
    for row in result:
        item = row[0]
        if len(row) > 1:
            item._row = row
        items.append(row[0])

    return Paginated(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )