from typing import Annotated

from fastapi import Depends
from lms.base.storage import S3Client, get_s3_client
from lms.database import get_session
from sqlalchemy.ext.asyncio import AsyncSession

SessionDep = Annotated[AsyncSession, Depends(get_session)]
S3ClientDep = Annotated[S3Client, Depends(get_s3_client)]
