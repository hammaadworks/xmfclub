# xmfclub - Unified Management Makefile

.PHONY: setup dev-backend dev-frontend dev help build-frontend install-backend install-frontend

# Default target
help:
	@echo "🥋 xmfclub Management Commands:"
	@echo "  make setup          Install all dependencies (Frontend & Backend)"
	@echo "  make dev            Run both Backend and Frontend in development mode"
	@echo "  make dev-backend    Run only the FastAPI backend"
	@echo "  make dev-frontend   Run only the TanStack Start frontend"
	@echo "  make build-frontend Build the frontend for production"
	@echo "  make test-backend   Run backend checks/tests"
	@echo "  make lint-frontend  Run frontend linting"

# Installation
setup: install-backend install-frontend

install-backend:
	@echo "📦 Installing Backend dependencies..."
	cd backend && uv sync

install-frontend:
	@echo "📦 Installing Frontend dependencies..."
	cd frontend && npm install

# Development
dev:
	@echo "🚀 Starting xmfclub Dev Environment..."
	@make -j 2 dev-backend dev-frontend

dev-backend:
	@echo "🔥 Starting FastAPI Backend on port 3330..."
	cd backend && uv run python -m fastapi dev --port 3330

dev-frontend:
	@echo "⚡ Starting TanStack Frontend on port 3331..."
	cd frontend && npm run dev -- --port 3331

# Production & Build
build-frontend:
	@echo "🏗️ Building Frontend..."
	cd frontend && npm run build

# Quality Control
test-backend:
	@echo "🧪 Verifying Backend..."
	cd backend && uv run python -c "from app.main import app; print('Backend Check Passed!')"

lint-frontend:
	@echo "🧹 Linting Frontend..."
	cd frontend && npm run lint
