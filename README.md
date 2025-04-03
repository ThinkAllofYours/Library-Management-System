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

1.프로젝트 클론

```bash
git clone https://github.com/your-repo/library-management-system.git
```

```bash
cd library-management-system
```

2.필수 설치 사항

- Docker
- Python
- Node.js
- Make
- Poetry

:::tip
프로젝트를 위해서 필수 설치 사항이 있습니다. 
:::

3.프로젝트 빌드

```bash
make build
```

```bash
make up-backend
```

```bash
alembic upgrade head
```

```bash
docker compose -f docker-compose-dev.yml run --rm storage-init
```

```bash
make up-frontend
```
