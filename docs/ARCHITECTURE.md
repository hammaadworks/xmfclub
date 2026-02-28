# Technical Architecture & System Design: xmfclub

This document outlines the technical architecture, data flow, and security model for the **xmfclub** platform. It is designed for deep technical review by engineering leads and architects.

---

## 1. High-Level Architecture

The system utilizes a **Decoupled (Headless) Architecture** to maximize frontend performance (SEO/UX) while keeping backend compute costs low and scalable.

### 1.1 Components
- **Frontend (Client):** TanStack Start (React, TypeScript), styled with Tailwind CSS and Shadcn/UI. Hosted statically on Vercel/Netlify for global edge caching and free/low-cost delivery.
- **Backend (API API):** Python FastAPI running on Uvicorn/uvloop. Deployed as a containerized application on **Fly.io** for low-latency compute close to the database.
- **Database:** PostgreSQL (with `asyncpg` driver for non-blocking I/O). Managed via Fly.io Postgres or a serverless provider like Supabase/Neon.
- **Authentication Provider:** Better Auth (Node ecosystem) running within the TanStack Start API routes, issuing secure JSON Web Tokens (JWTs) or signed session cookies.
- **Media Storage:** S3-compatible object storage (AWS S3 or Cloudflare R2 for zero egress fees).

### 1.2 Request Flow Diagram
1. **Client** requests static UI from Vercel Edge.
2. **Client** submits login credentials to TanStack API Route (Better Auth).
3. **Better Auth** validates credentials against the PostgreSQL DB and returns an HTTP-only Cookie / JWT to the Client.
4. **Client** makes a data request (e.g., `GET /api/v1/inventory`) to the FastAPI server on Fly.io, attaching the JWT in the Authorization header.
5. **FastAPI** intercepts the request, validates the JWT cryptographically (stateless verification), extracts the `user_id` and `role` (RBAC), and serves the data from PostgreSQL using `asyncpg`.

---

## 2. Security & Authentication Model

### 2.1 Stateless JWT Authentication (Decoupled Auth)
Because the frontend handles the actual OAuth/Credentials flow via Better Auth, the FastAPI backend relies on **Stateless JWT Verification**.
- **The Secret:** Both TanStack (Better Auth) and FastAPI share the same `JWT_SECRET_KEY`.
- **Validation:** FastAPI middleware decodes the incoming JWT. If the signature is valid and it hasn't expired, the request is trusted. This avoids a synchronous database hit on every API call, massively increasing throughput.
- **Payload:** The JWT payload contains `sub` (User UUID) and `role` (admin, trainer, student).

### 2.2 Role-Based Access Control (RBAC)
FastAPI implements dependency injection to enforce RBAC at the route level:
```python
# Example Internal API Implementation
@app.post("/api/v1/inventory")
async def create_inventory(
    data: InventoryCreate, 
    current_user: User = Depends(get_current_admin_user)
):
    ...
```
- **Admin:** Full access to billing, user mutation, inventory creation, and NFC provisioning.
- **Trainer:** Access to attendance mutation, media upload (pre-signed S3 URLs), and schedule management.
- **Student:** Read-only access to their specific curriculum, payments, and media.

### 2.3 Hardware Security (RFID/NFC Linkage)
To prevent spoofing or unauthorized access:
1. The Admin portal generates a secure UUID (e.g., `uuid4()`).
2. This UUID is written to a blank NTAG215 NFC chip as an NDEF URI payload: `https://xmfclub.com/s/{uuid}`.
3. The Admin physically **locks (write-protects)** the NFC chip using the writer hardware. It can never be altered again.
4. The database maps this UUID to the `User.rfid_uuid` column.
5. **Scan Logic:** If a phone scans the locked chip, it opens the URL. The TanStack frontend checks the user's active session. If unauthorized, it renders the "Public Brag Page". If the scanner is an authenticated Admin, it renders the full private profile.

---

## 3. Database Schema (SQLModel / Alembic)

The database utilizes `SQLModel` (built on SQLAlchemy 2.0 and Pydantic) to ensure type safety between the ORM and API serialization layers.

### 3.1 Core Entities
- **`User` Table:** The central identity. Includes `role` for RBAC, `rfid_uuid` for hardware linkage, and `belt_rank`.
- **`Module` Table:** The blueprints for the *A la Carte* curriculum. Now includes `session_price` and `default_venue`.
- **`SlotTemplate` Table:** Defines recurring class schedules (e.g., Monday 10 AM) with capacity and venue.
- **`SlotInstance` Table:** The actual bookable supply. Generated from templates for specific dates. Handles date-specific capacity overrides.
- **`Subscription` & `SubscriptionSlot`:** Links users to modules and specific date-based slot instances.

### 3.2 The Inventory Engine (Supply vs Demand)
The system distinguishes between **Master Schedule (Templates)** and **Available Supply (Instances)**.
- **Supply Generation:** Admin publishes `SlotInstances` for a rolling window (e.g., 30-90 days).
- **Flexible Booking:** Students select specific dates/slots from the calendar.
- **Concurrency:** Capacity checks happen at the `SlotInstance` level to ensure precise per-day availability.

---

## 4. Payment Flow & Orchestration

### 4.1 Multi-Gateway Orchestrator
To ensure reliability and smart routing, the backend uses a **Payment Orchestrator (Strategy Pattern)**.
- **Supported Gateways:** Razorpay, PhonePe, Cashfree.
- **Abstraction:** A unified `PaymentProvider` interface allows swapping gateways without changing business logic.
- **Smart Routing:** (Planned) Route based on success rates or transaction fees.

### 4.2 Dynamic Pricing Logic
Subscriptions are no longer flat-rate. Price is calculated dynamically:
`Total Price = (Sessions per Day) * (Number of Days) * (Module Session Rate)`.
- **Pro-Rata Adjustments:** Mid-month upgrades (adding sessions or extending dates) calculate the price difference and charge immediately.
- **Halal Freeze & Leave:** "Leave" requests extend the `next_billing_date` by the number of days missed, preserving the student's paid value.

---

## 5. Media Architecture (Zero-Bottleneck Uploads)

To prevent the FastAPI backend from becoming bottlenecked by large video uploads from trainers:
1. **Client (Trainer Phone)** requests an upload ticket from FastAPI.
2. **FastAPI** authenticates the trainer and uses AWS boto3 (or equivalent) to generate a **Pre-signed S3 POST URL**.
3. **Client** uploads the video directly from the browser/app to the S3 bucket using the pre-signed URL.
4. **Client** notifies FastAPI that the upload is complete, and FastAPI saves the object URL to the student's media timeline. 
*(This ensures 0 bytes of video traffic ever touch the Fly.io compute instances).*