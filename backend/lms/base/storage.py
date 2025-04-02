import os
import uuid

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from fastapi import UploadFile

from ..config import settings


class S3Client:
    def __init__(self):
        self.client = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            config=Config(signature_version="s3v4"),
        )
        self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME

    def generate_unique_filename(self, filename: str) -> str:
        name, ext = os.path.splitext(filename)
        unique_suffix = uuid.uuid4().hex[:8]
        return f"{name}_{unique_suffix}{ext}"

    def upload_file(self, file_obj, path_prefix, object_name=None) -> str:
        if object_name is None:
            object_name = self.generate_unique_filename(file_obj.filename)

        full_path = os.path.join(path_prefix, object_name)

        try:
            self.client.upload_fileobj(file_obj.file, self.bucket_name, full_path, ExtraArgs={})
        except Exception:
            return None

        return f"{settings.AWS_S3_CLIENT_URL_BASE}/{full_path}"

    def delete_file(self, path: str) -> bool:
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=path)
            return True
        except ClientError:
            return False

    def set_file(
        self, current_url: str, new_file: UploadFile | str | None, path_prefix: str, optimize: bool = False
    ) -> str:
        if isinstance(new_file, str):
            return new_file

        if current_url:
            key_prefix = f"{settings.AWS_S3_CLIENT_URL_BASE}"
            if key_prefix in current_url:
                old_key = current_url.split(key_prefix)[1]
                self.delete_file(old_key)

        if new_file:
            if (
                optimize
                and isinstance(new_file, UploadFile)
                and new_file.content_type
                and new_file.content_type.startswith("image/")
            ):
                import io

                from PIL import Image

                image = Image.open(new_file.file)
                output = io.BytesIO()
                if image.format == "JPEG":
                    image.save(output, format="JPEG", quality=85, optimize=True)
                elif image.format == "PNG":
                    image.save(output, format="PNG", optimize=True)
                else:
                    image.save(output, image.format, optimize=True)
                output.seek(0)
                new_file.file = output

            file_url = self.upload_file(new_file, path_prefix)
            if not file_url:
                raise ValueError(f"Failed to upload file to {path_prefix}")
            return file_url
        return ""

    def get_file(self, key: str) -> str:
        if key.startswith(f"{settings.AWS_S3_CLIENT_URL_BASE}/"):
            key = key.replace(f"{settings.AWS_S3_CLIENT_URL_BASE}/", "")
        try:
            response = self.client.get_object(Bucket=self.bucket_name, Key=key)
            return response
        except Exception as e:
            raise ValueError(f"Failed to get file: {e}")

    def check_upload(self, url: str) -> bool:
        try:
            key_prefix = f"{settings.AWS_S3_CLIENT_URL_BASE}/"
            if key_prefix in url:
                key = url.split(key_prefix)[1]
                self.client.head_object(Bucket=self.bucket_name, Key=key)
                return True
            return False
        except Exception:
            return False


s3_client = S3Client()


def get_s3_client():
    return s3_client
