from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from lms.api.authors.model import Author
from lms.deps import SessionDep
from lms.util.utils import PaginationParams, paginate
from pydantic import BaseModel
from sqlalchemy import select

router = APIRouter(prefix="/api/authors", tags=["authors"])

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


########################################################
# Author CRUD
########################################################


@router.post("/", response_model=AuthorResponse)
async def create_author(author: AuthorCreate, session: SessionDep):
    db_author = Author(**author.model_dump())
    session.add(db_author)
    await session.commit()
    await session.refresh(db_author)
    return db_author


@router.get("/{id}", response_model=AuthorResponse)
async def get_author(id: str, session: SessionDep):
    query = select(Author).where(Author.id == id)
    result = await session.execute(query)
    author = result.scalar_one_or_none()

    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    return author


@router.get("/", response_model=List[AuthorResponse])
async def get_authors(session: SessionDep, name: Optional[str] = None, pagination: PaginationParams = Depends()):
    query = select(Author).order_by(Author.name)

    if name:
        query = query.where(Author.name.ilike(f"%{name}%"))

    paginated = await paginate(session, query, pagination)
    return paginated.items


@router.put("/{id}", response_model=AuthorResponse)
async def update_author(id: str, author_update: AuthorCreate, session: SessionDep):
    query = select(Author).where(Author.id == id)
    result = await session.execute(query)
    db_author = result.scalar_one_or_none()

    if not db_author:
        raise HTTPException(status_code=404, detail="Author not found")

    for field, value in author_update.model_dump().items():
        setattr(db_author, field, value)

    db_author.modified = datetime.now().isoformat()

    await session.commit()
    await session.refresh(db_author)
    return db_author


@router.delete("/{id}")
async def delete_author(id: str, session: SessionDep):
    query = select(Author).where(Author.id == id)
    result = await session.execute(query)
    db_author = result.scalar_one_or_none()

    if not db_author:
        raise HTTPException(status_code=404, detail="Author not found")

    await session.delete(db_author)
    await session.commit()
    return {"message": "Author deleted successfully"}
