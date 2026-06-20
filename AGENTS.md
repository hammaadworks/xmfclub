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
# GEMINI.md

## Documentation Maintenance Rule
- **Always keep the `docs/` folder updated** with current implementation details and design decisions.
- Any architectural change or significant feature implementation must be reflected in the relevant document within `docs/` (e.g., `ARCHITECTURE.md`, `SYSTEMS.md`, `DESIGN_SYSTEM.md`).
- If a new system or significant component is added, create a new document in `docs/` if it doesn't fit existing ones.

## Engineering Standards
- **Clean Code**: Adhere to Clean Code principles (S.O.L.I.D, DRY, KISS).
- **Type Safety**: Maintain strict type safety in both TypeScript (Frontend) and Python (Backend via SQLModel/Pydantic).
- **Security**: Never expose secrets. Use environment variables for sensitive data. Shared `JWT_SECRET_KEY` between frontend (Better Auth) and backend (FastAPI).

## Development Workflow
- Use `make` commands for common tasks (setup, dev, build).
- Frontend runs on port 3331, Backend on port 3330.
- Database migrations are handled via Alembic in the `backend/` directory.
