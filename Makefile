.PHONY: shell up-backend up-frontend install

build:
	cd backend && poetry run build

shell:
	cd backend && poetry env activate

up-backend:
	docker network create lms || true
	docker-compose -f docker-compose-dev.yml up -d

up-frontend:
	docker-compose -f docker-compose-front.yml up -d

restart-backend:
	docker-compose -f docker-compose-dev.yml down
	docker-compose -f docker-compose-dev.yml up -d

scrape:
	cd backend && poetry run scrape

install:
	# Install backend dependencies
	cd backend && poetry install
	# Install frontend dependencies
	cd frontend && npm install
	# Create necessary environment files if they don't exist
	@if [ ! -f backend/.env ]; then \
		echo "Creating backend .env file..."; \
		cp backend/.env.example backend/.env; \
	fi
	@if [ ! -f frontend/.env ]; then \
		echo "Creating frontend .env file..."; \
		cp frontend/.env.example frontend/.env; \
	fi
