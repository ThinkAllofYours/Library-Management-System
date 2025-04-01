FROM python:3.12-alpine as builder

WORKDIR /app

RUN apk add --no-cache \
  gcc \
  musl-dev \
  python3-dev \
  zlib-dev \
  jpeg-dev \
  openjpeg-dev \
  g++ \
  libffi-dev \
  pkgconfig \
  && rm -rf /var/cache/apk/*

COPY pyproject.toml poetry.lock README.md ./
RUN pip install --no-cache-dir poetry \
  && poetry config virtualenvs.create false \
  && poetry install --without dev --no-root  \
  && pip install --no-cache-dir taskiq taskiq-fastapi uvicorn[standard] psycopg2-binary \
  && rm -rf /root/.cache/pip/* /root/.cache/poetry/*


# Runtime stage
FROM python:3.12-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache \
  gcc \
  musl-dev \
  python3-dev \
  zlib-dev \
  jpeg-dev \
  openjpeg-dev \
  g++ \
  libffi-dev \
  pkgconfig \
  && rm -rf /var/cache/apk/* \
  && find /usr/local \( -type d -a -name test -o -name tests -o -name '__pycache__' \) -o \( -type f -a -name '*.pyc' -o -name '*.pyo' -o -name '*.a' \) -exec rm -rf '{}' +


# Copy installed Python packages from builder stage
COPY --from=builder /usr/local/lib/python3.12/site-packages/ /usr/local/lib/python3.12/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Create app user and set permissions
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY --chown=app:app lms ./lms
COPY --chown=app:app scripts ./scripts
COPY --chown=app:app pyproject.toml poetry.lock alembic.ini ./
COPY --chown=app:app README.md ./

ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/usr/local/bin:$PATH"

USER app

EXPOSE 8012

CMD ["uvicorn", "lms.main:app", "--host", "0.0.0.0", "--port", "8012"]
