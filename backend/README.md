# ⚙️ xmfclub Backend

The high-performance engine powering the **xmfclub** ecosystem. This is where the visionary "a la carte" curriculum meets robust data orchestration. Built with modern Python primitives, it ensures that every payment, student enrollment, and training module is handled with absolute precision and speed.

---

## 🧩 Core Modules

- **Payments Orchestrator**: Integrated with Razorpay for seamless, secure financial flows.
- **Subscription Engine**: Managing the full lifecycle of student memberships and access.
- **Inventory & Store**: Driving the digital storefront and equipment management.
- **Curriculum Engine**: The logic behind the personalized, "a la carte" training paths.
- **RBAC Security**: Robust role-based access control for a multi-tier user ecosystem.

## 🛠️ Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) – Asynchronous, high-performance API development.
- **Database**: [SQLModel](https://sqlmodel.tiangolo.com/) – Type-safe ORM leveraging Pydantic and SQLAlchemy.
- **Migrations**: [Alembic](https://alembic.sqlalchemy.org/) – Reliable database schema evolution.
- **Payments**: [Razorpay](https://razorpay.com/) – Scalable payment processing.
- **Management**: [uv](https://github.com/astral-sh/uv) – The next-generation Python package installer and resolver.

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   uv sync
   ```
2. **Configure Environment**:
   Create a `.env` file based on the project's requirements:
   - `DATABASE_URL`
   - `JWT_SECRET_KEY`
   - `RAZORPAY_KEY_ID` / `SECRET`
3. **Run Migrations**:
   ```bash
   uv run alembic upgrade head
   ```
4. **Launch Server**:
   ```bash
   uv run fastapi dev
   ```

---
*Powering the evolution of martial arts.*
