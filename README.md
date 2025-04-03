# Library-Management-System

Library-Management-System for coding interview

## 프로젝트 소개

이 프로젝트는 라이브러리 관리 시스템입니다. 

## 기능

- 책 목록 조회
- 책 검색
- 책 등록
- 책 수정
- 책 삭제

## 사용 기술

- Next.js
- Tailwind CSS
- TypeScript
- React Query

## 설치 방법

### 프로젝트 클론

```bash
git clone https://github.com/your-repo/library-management-system.git
```

```bash
cd library-management-system
```

### 필수 설치 사항

- Docker
- Python
- Node.js
- Make
- Poetry

### mac에서 설치방법

```bash
brew install docker
brew install python
brew install node
brew install make
brew install poetry
```

:::tip
프로젝트를 위해서 필수 설치 사항이 있습니다.
:::

### 프로젝트 시작하기

#### 가상환경 실행

```bash
poetry shell && poetry install
```

#### 프로젝트 빌드

```bash
make build
```

```bash
make up-backend
```

```bash
alembic upgrade head
```

#### 스토리지 초기화

```bash
docker compose -f docker-compose-dev.yml run --rm storage-init
```

#### 프론트엔드 빌드

```bash
make build-frontend
```

#### 프론트엔드 실행

```bash
make up-frontend
```
