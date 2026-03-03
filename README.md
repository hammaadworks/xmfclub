# xmfclub 🥋⚡️

**xmfclub** is a high-energy, futuristic fitness and Taekwondo platform designed for modular training and business scalability.

---

## 📂 Project Structure

- **`/backend`**: FastAPI (Python) server handling business logic, RBAC, inventory, and payments.
- **`/frontend`**: TanStack Start (React + TypeScript) client-side application with a "Bento Grid" design.
- **`/docs`**: Centralized documentation for technical review and business strategy.

---

## 📖 Documentation Index (The Source of Truth)

For a deep technical or business review, please refer to the following:

1.  **[System Purpose & Business Logic](docs/SYSTEMS.md)**: The "Why" and "What" of the project—Student Management, Payments, and Revenue scaling.
2.  **[Technical Architecture](docs/ARCHITECTURE.md)**: High-level design, decoupled request flows, and security models.
3.  **[Agile Roadmap (EPICS)](docs/EPICS.md)**: Live tracking of development progress and feature stories.
4.  **[Design System & Brand](docs/DESIGN_SYSTEM.md)**: Visual language, typography, and UI patterns (Grid-to-Reels).

---

## 🚀 Quick Start

The project uses a `Makefile` for unified management.

### Full Development Environment
```bash
make setup  # Install all dependencies
make dev    # Start both Frontend and Backend
```

### Individual Components
- **Backend Only**: `make dev-backend`
- **Frontend Only**: `make dev-frontend`
- **Build Frontend**: `make build-frontend`


---
*Built with ❤️ for Extreme Martial Arts & Fitness.*
