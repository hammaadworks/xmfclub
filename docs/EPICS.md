# Agile Development Roadmap & Epics: xmfclub

This document translates the `SYSTEMS.md` business logic into actionable Agile Epics and User Stories. Developers should use this file to track progress, ensuring no business requirement or constraint is missed during implementation. 

Mark stories as complete (`- [x]`) as they are deployed.

---

## EPIC 1: Core Engine, Database & RBAC ✅
**Goal:** Establish the foundational infrastructure, secure routing, and role-based access control (Admin, Trainer, Student, Guest).

- [x] **Story 1.1: Backend Infrastructure Setup**
- [x] **Story 1.2: Authentication & RBAC (Better Auth & FastAPI Decoupled)**
- [x] **Story 1.3: Core Database Schema**
- [x] **Story 1.4: Admin Genesis Protocol & Provisioning**

---

## EPIC 2: The "A la Carte" Builder & Inventory Engine ✅
**Goal:** Build the core USP—allowing users to customize their training curriculum while strictly protecting facility and trainer capacity.

- [x] **Story 2.1: The Inventory Engine (Template-Instance Split)**
- [x] **Story 2.2: The A la Carte UI (Frontend Public Builder)**
- [x] **Story 2.3: Admin Command Center (Template & Instance Management UI)**
- [ ] **Story 2.4: Flexible Date-Based Enrollment Logic** (Backend logic in `enrollment.py` ready)

---

## EPIC 3: Payments, Billings & Halal Freeze ✅
**Goal:** Implement the Razorpay integration, offline payment logging, and the fair-play freeze policy without predatory auto-billing.

- [x] **Story 3.1: Multi-Gateway Orchestrator (Razorpay, PhonePe, Cashfree)**
- [ ] **Story 3.2: Dynamic Per-Session Pricing & Pro-Rata Math** (Logic implemented in `subscription_engine.py`)
- [x] **Story 3.3: Offline/Manual Payment Logging**
- [x] **Story 3.4: The Halal Freeze & Leave Policy**

---

## EPIC 4: Hardware Bridge (RFID) & Student Microsite ✅
**Goal:** Connect physical NFC cards to digital profiles with strict privacy controls.

- [x] **Story 4.1: The Admin NFC Writer Tool** (API & Basic UI done)
- [x] **Story 4.2: The Public "Brag Page" (Guest Scan)**
- [x] **Story 4.3: The Authenticated Profile (Admin/Self Scan)**

---

## EPIC 5: Coach Portal & Media Operations ✅
**Goal:** Give trainers frictionless mobile tools to run the floor and engage parents.

- [x] **Story 5.1: Frictionless Attendance Tracking**
- [x] **Story 5.2: Cloud Storage Setup (S3/Fly)**
- [x] **Story 5.3: Student Media Uploads** (Pre-signed URL flow implemented)
- [x] **Story 5.4: Trainer Schedule Management** (Backend done)

---

## EPIC 6: In-House Demo CRM Pipeline ✅
**Goal:** Convert leads smoothly without relying on third-party tools like Calendly.

- [x] **Story 6.1: Custom Demo Booking Calendar**
- [ ] **Story 6.2: Automated Reminders** (Infrastructure ready)
- [x] **Story 6.3: Post-Demo Conversion Flow**

---

## EPIC 7: Event Management (Seminars & Gradings) ✅
**Goal:** Handle large gatherings, dynamic pricing, and digital certificates.

- [x] **Story 7.1: Standalone Event Pages**
- [x] **Story 7.2: Dynamic Pricing & Lead Capture**
- [x] **Story 7.3: Rapid QR Check-in**
- [x] **Story 7.4: Digital Certificate Generation** (Backend logic ready)

---

## EPIC 8: Alternate Revenue (Grid-to-Reels Store & Assets) ✅
**Goal:** Sell gear and digital products using high-conversion UI patterns.

- [x] **Story 8.1: The Storefront Grid**
- [x] **Story 8.2: The "Reels-Style" Product View**
- [x] **Story 8.3: Digital Materials Delivery**
