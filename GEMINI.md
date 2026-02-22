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
