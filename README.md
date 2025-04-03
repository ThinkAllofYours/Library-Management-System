# Library-Management-System

온라인 서점을 위한 웹 애플리케이션입니다.

## 프로젝트 소개

이 프로젝트는 도서 관리 시스템으로, 책 목록 조회, 검색, 등록, 수정, 삭제 등의 기능을 제공합니다.

## 주요 기능

### 프론트엔드

- 책 목록 페이지
  - 페이지네이션 (한 페이지당 10개 항목)
  - 무한 스크롤
  - 제목과 저자 기반 검색 기능
- 책 상세 정보 페이지
- 책 추가/제거 및 수량 조절
- 반응형 디자인

### 백엔드

- RESTful API
  - 책 목록 조회 (GET /api/books)
  - 책 상세 정보 조회 (GET /api/books/:id)
  - 책 추가 (POST /api/books/:id)
  - 책 정보 수정 (PUT /api/books/:id)
  - 책 삭제 (DELETE /api/books/:id)
- 데이터베이스 연동
- 파일 스토리지 관리

## 기술 스택

### 프론트엔드

- Next.js 15.2.4
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query

### 백엔드

- Python (최신 버전)
- FastAPI
- PostgreSQL
- SQLAlchemy
- Poetry

### 인프라

- Docker & Docker Compose
- MinIO (S3 호환 스토리지)

## 설치 방법

### 필수 요구사항

- Docker
- Python
- Node.js
- Make
- Poetry

### Mac OS에서 설치하는 방법

```bash
brew install docker
brew install python
brew install node
brew install make
brew install poetry
```

## 프로젝트 실행

### 1. 백엔드 설정

```bash
# 가상환경 활성화 및 의존성 설치
poetry shell && poetry install

# 프로젝트 빌드
make build

# 백엔드 서버 실행
make up-backend

# 데이터베이스 마이그레이션
cd backend && alembic upgrade head
```

### 2. 스토리지 초기화

```bash
docker compose -f docker-compose-dev.yml run --rm storage-init
```

### 3. 프론트엔드 실행

#### 개발 환경

```bash
cd frontend/lms
npm install
npm run dev
```

#### Docker 환경

```bash
make build-frontend
make up-frontend
```

## 알라딘 데이터 스크래핑

프로젝트는 알라딘 도서 정보를 자동으로 가져올 수 있습니다.

### 사용 방법

1. 알라딘 웹사이트에서 원하는 도서 페이지로 이동
2. 도서 상세 페이지의 URL을 복사
3. 스크래핑 명령어 실행:
4. 초기 데이터 삽입

```bash
make scrape
```

### 주의사항

- 과도한 요청은 IP 차단의 원인이 될 수 있습니다.