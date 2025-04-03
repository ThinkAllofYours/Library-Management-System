from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute

from .api.authors.api import router as authors_router
from .api.books.api import router as books_router
from .config import settings

app = FastAPI()


def custom_generate_unique_id(route: APIRoute) -> str:
    """
    API 라우트의 고유 ID를 생성하는 함수입니다.

    Args:
        route (APIRoute): FastAPI 라우트 객체

    Returns:
        str: 생성된 고유 ID (카멜케이스로 변환된 문자열)

    Example:
        >>> route = APIRoute(tags=["books"], prefix="/books")
        태그가 "user"이고 라우트 이름이 "create-item"이면 → UserCreateItem이 됩니다.
    """
    schema_name = f"{route.tags[0]}_{route.name}"
    return "".join(word.capitalize() for word in schema_name.replace("-", "_").split("_"))


app = FastAPI(
    title="Library Management System",
    description="Library Management System is a system for managing library resources.",
    version="0.0.1",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    # openapi
    generate_unique_id_function=custom_generate_unique_id,
)

api_router = APIRouter(prefix="/api")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(books_router)
app.include_router(authors_router)
