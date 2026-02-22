# AGENTS.md

## Project Overview

**xmfclub** is a unified management platform for a martial arts club. It features a decoupled architecture:
- **Frontend**: TanStack Start (React, TypeScript), Tailwind CSS, Shadcn/UI.
- **Backend**: Python FastAPI, SQLModel (SQLAlchemy 2.0 + Pydantic), PostgreSQL.
- **Authentication**: Better Auth (Node ecosystem) integrated into TanStack Start API routes.
- **Infrastructure**: Fly.io (Backend/DB), Vercel/Netlify (Frontend), S3/R2 (Media).

## Setup Commands

- **Install all dependencies**: `make setup`
- **Install Backend only**: `cd backend && uv sync`
- **Install Frontend only**: `cd frontend && npm install`

## Development Workflow

- **Run full stack**: `make dev` (Frontend: port 3331, Backend: port 3330)
- **Run Backend only**: `make dev-backend`
- **Run Frontend only**: `make dev-frontend`
- **Database Migrations**: `cd backend && uv run alembic upgrade head`

## Testing Instructions

- **Frontend Tests**: `cd frontend && npm run test`
- **Backend Checks**: `make test-backend`
- **Linting (Frontend)**: `cd frontend && npm run lint`
- **Format (Frontend)**: `cd frontend && npm run format`

## Code Style

- **Frontend**: Follows standard React/TypeScript patterns with TanStack Router. Uses ESLint and Prettier.
- **Backend**: Uses SQLModel for unified models/schemas. Follows FastAPI best practices (Dependency Injection, Type Hints).
- **Architecture**: Decoupled Auth (Stateless JWT). Shared `JWT_SECRET_KEY` between frontend and backend.

## Documentation Policy

Agents MUST keep the `docs/` directory updated with any implementation or design changes.
- `ARCHITECTURE.md`: High-level system design and data flow.
- `SETUP.md`: Genesis protocol and initial provisioning.
- `SYSTEMS.md`: Detailed breakdown of sub-systems.
- `DESIGN_SYSTEM.md`: UI/UX standards and theme.

## Deployment

- **Backend**: Deployed to Fly.io as a containerized app.
- **Frontend**: Static/SSR deployment to Vercel or Netlify.
- **Database**: PostgreSQL on Fly.io or external provider.
