# Systems & Business Documentation: xmfclub

This document serves as the source of truth for the project's logic, business systems, and long-term scaling strategy. It ensures that any AI or contributor understands the core purpose and avoids deviating from the proposed plans.

---

## 1. Project Purpose & Vision
**xmfclub** is a high-energy, futuristic fitness and Taekwondo club. The goal is to build a robust brand and a suite of integrated systems that allow the business to scale beyond a single physical location.

- **Vibe:** Kinetic, Intense, Professional.
- **Philosophy:** Modular training (Alacarte) combined with traditional martial arts discipline.

---

## 2. Core Business Systems

### A. Student Management System (SMS) & Onboarding Flow
- **Purpose:** Centralized database covering the entire student journey from acquisition to ongoing engagement.
- **1. Acquisition & Discovery:** Students find the club via Google search, word-of-mouth, referrals, or organic social media.
- **2. The Landing Experience:** The website acts as a high-trust conversion funnel. The primary CTA urges users to "Join the Club."
- **3. The Fork in the Road:**
  - **Path A (Direct Enroll):** The user jumps into the *A la Carte* curriculum builder. This is the core USP. They select specific modules, choose days/times, and complete the payment.
  - **Path B (Book a Demo):** User schedules a session to speak with a trainer before committing.
- **4. Profile Creation & Hardware Integration:**
  - Upon successful payment, a digital profile is generated.
  - The student is issued an **RFID/NFC Card** which serves as their physical Student ID.
- **5. The Student Microsite:**
  - Scanning the RFID card points to a dedicated, personalized digital microsite for that student.
  - **Data Displayed:** Name, Belt Rank, active Curriculum, Join Date, Fee status, and gamified elements (Avatars, Badges).
  - **Parental Engagement (Media):** Trainers can record short training clips and upload them directly to the student's profile. When parents scan the card at home, they can see their child's recent progress videos.

**Resolved Architecture & Security (V1):**
- **Hardware Linkage (RFID/NFC):** Cards are programmed with a unique, read-only URL (`xmfclub.com/s/uuid`). Admins use a secure internal tool to associate this UUID with a student profile. The NFC chips are physically locked (write-protected) after initial programming to prevent students from altering the payload, ensuring zero tampering.
- **Privacy via RBAC (Role-Based Access Control):** 
  - *Public/Guest Scan (Native OS):* If a parent or friend scans the card with a standard phone camera/NFC reader, they see a public "Brag Page" (Name, Belt, Gamified Badges, Public Videos). No sensitive data is exposed.
  - *Authenticated Scan (In-App):* If an Admin or the logged-in Student scans the card via the xmfclub app, the RBAC system grants access to the full profile, exposing hidden layers like fee status, internal grading notes, and payment history.

**Resolved Workflows (Demo & Availability):**
- **6. The Demo CRM Pipeline:**
  - *Booking (The Calendar Decision):* Because our *A la Carte* builder requires strict, real-time inventory management (facility capacity, trainer availability), relying on a third-party tool like Calendly creates a disconnected source of truth. Therefore, we will build a **wholesome, in-house booking module**. It will integrate directly with our FastAPI Inventory Engine, ensuring a unified system for both demo bookings and paid class slots.
  - *Pre-Demo:* Automated WhatsApp/Email reminders to ensure high show-up rates.
  - *Post-Demo (Conversion):* After the demo, the trainer marks the status. The system automatically sends a follow-up message containing a direct link to the *A la Carte* checkout.
- **7. Calendar & Availability Engine (Supply Logistics):**
  - **The Supply side:** Admins define **SlotTemplates** (recurring schedule). The system (or Admin) generates **SlotInstances** for a specific rolling window (e.g., 30 days).
  - **The Demand side:** Students browse the calendar and select specific `SlotInstances`. This allows for "A la Carte" flexibility (e.g., only weekends, or different slots each week).
  - **Capacity Management:** `current_enrollment` is tracked per `SlotInstance`. If a trainer cancels a specific date, only that instance is marked inactive, not the whole template.
  - **Pricing:** Subscriptions are calculated per-session. Upgrades or extensions are charged immediately based on pro-rata math.
  - **Leave Policy:** Students can request a "Leave" for a specific day. If approved, the system extends their `next_billing_date` by 1 day, effectively "pausing" their subscription for that session.

---

### B. Payments & Billings
- **Purpose:** Automate revenue collection, track financial health, and maintain the system as the single source of truth without relying on predatory auto-billing practices.
- **1. Payment Gateway (PSP):** **Razorpay** is the primary provider for processing digital transactions.
- **2. The Membership Model (Subscriptions without Auto-Pay):**
  - All enrollments are treated as a "Club Membership" (Monthly or Quarterly, depending on the specific *A la Carte* modules selected).
  - **No Auto-Mandates:** We do not force auto-pay (mandates). Instead, the system generates an invoice when the cycle is due and sends a digital payment link via WhatsApp/Email. The user retains full control over when they click 'Pay'.
  - *Grace Period Logic:* If an invoice is unpaid past the due date, the system triggers a soft reminder. After a defined period, the student's microsite (RFID scan) will indicate a "Payment Pending" status to the admin/trainer.
- **3. Offline & Manual Payments (Cash/UPI):**
  - The system fully supports offline transactions. 
  - Admins/Trainers have a module to manually log "Cash Received" or "Direct UPI Transfer."
  - Once logged, the system automatically marks the pending digital invoice as "Paid" and issues a digital receipt to the user. This ensures offline payments don't break the digital tracking loop.
- **4. The Halal Freeze Policy (Fairness First):**
  - **Philosophy:** Neither the club nor the student should take an unfair loss due to unforeseen circumstances (e.g., injury, severe illness, long travel).
  - **Logic:** A student can request to "Freeze" their membership. 
  - If approved by an admin, their billing cycle is paused. The remaining paid days are credited and pushed to the future. 
  - *Example:* If a student pays for 30 days but breaks their leg on day 15, they freeze the account. When they return 2 months later, they still have 15 paid days remaining before the next invoice is generated.
  - *Constraint:* To prevent abuse, freezes may require a valid reason and cannot be applied retroactively (e.g., you can't freeze today for classes you missed last week).

### C. Coach & Staff Management (RBAC)
- **Purpose:** Empower instructors, manage staff operations, and facilitate content delivery to students.
- **Role Hierarchy:**
  - **Admins (Managers):** Employees who oversee the club's operations, manage other trainers, handle complex billing/freezes, and hold top-level RBAC privileges. (In real life, a trainer can also hold an Admin role).
  - **Trainers (Coaches):** The core frontline staff. They hold standard staff privileges.
- **Trainer Capabilities:**
  - **Attendance:** Quickly mark student attendance via their portal.
  - **Content & Data:** Upload and manage student progress data (photos, videos) directly to student profiles for parents to see on the microsite.
  - **Schedule Management:** Trainers have a dedicated interface to manage their own availability and class schedules, directly feeding into the *A la Carte* Inventory Engine.

### D. Event Management
- **Purpose:** Streamline competitions, workshops, belt gradings, and public seminars.
- **Key Features:**
  - **Standalone Landing Pages:** Every event gets its own dedicated URL (e.g., `xmfclub.com/events/summer-kick`). This maximizes SEO and shareability on social media.
  - **Dynamic Pricing (Members vs. Visitors):**
    - The registration flow automatically detects if the user is an active club member (via login or checking their phone/email against the SMS).
    - **Members:** Receive discounted or free access based on their *A la Carte* package.
    - **Visitors:** Pay the public rate and their basic contact info is captured as a "Lead" for future marketing.
  - **Visitor Management & Check-in:** A rapid QR-code check-in system at the door to handle large volumes of attendees efficiently.
  - **Post-Event Digital Assets:** Upon successful completion of an event (like a Belt Grading), the system can automatically generate a digital PDF Certificate. For club members, this asset is permanently attached to their Student Microsite.

---

## 3. Revenue Streams (Scaling Strategy)

### A. Primary Revenue
- **Memberships:** Monthly/Annual club fees.
- **Alacarte Curriculum:** Pay-per-module training (digital + physical hybrid).

### B. Alternate Revenue (Scale & Affiliate)
- **Purpose:** Monetize the club's influence and provide high-quality gear/training resources to students without holding massive physical inventory.
- **1. The Storefront UI (Grid to Reels):**
  - *Discovery (The Grid):* Users browse a clean, visually appealing e-commerce grid of recommended products.
  - *Engagement (The Reels View):* When a user clicks a product, it opens a vertical, TikTok/Reels-style full-screen view. This allows trainers to post short, energetic video reviews of the gear (e.g., hitting a heavy bag with Decathlon gloves) with a persistent "Buy Now" button overlay.
- **2. Affiliate Marketing:**
  - Collaborations with **Decathlon** and **Amazon**.
  - Recommended gear lists (Uniforms, Sparring kits, Supplements). The "Buy Now" links redirect with our affiliate tags.
- **3. Proprietary Products & Digital Materials:**
  - **Merch:** Direct purchase flow for branded xmfclub apparel.
  - **Soft Digital Materials (PDFs, Courses):** Flexible monetization strategy based on executive decisions:
    - *Freebies:* Used as lead magnets for email capture or included as free value-adds for specific *A la Carte* membership tiers.
    - *Premium:* High-value courses or specialized training programs sold as one-time purchases.
---

## 4. Implementation Strategy (Technical Mapping)

**Architecture Model:** Decoupled. A completely Static Frontend (hosted for free/low-cost) paired with a high-performance Backend Server to optimize compute costs.

| System | Frontend Component (Static UI) | Backend Service (FastAPI / Python) | Infrastructure / Hosting |
|--------|--------------------------------|-------------------------------------|---------------------------|
| Core API | Client-side Fetch/Axios | FastAPI REST/GraphQL Endpoints | Backend: Fly.io |
| Database & Auth | JWT/Session Cookies | Better Auth + PostgreSQL/Supabase | Database: Fly.io or external |
| Student Microsite | React App (`/s/:uuid`) | RBAC Logic & Media Retrieval | Frontend: Vercel / Netlify |
| Media Storage | `<video>` and `<img>` tags | Presigned Upload URLs (S3 API) | S3 (via Fly.io or AWS fallback)|
| Payments | Checkout Flow | Stripe Integration Endpoints | Backend: Fly.io |
| Events | Event Landing / QR Check-in | QR Generation & Validation Logic | Backend: Fly.io |

---

## 5. Ongoing Evolution & Questions
To deepen the implementation, the following areas require clarification:
1. **Student Data:** What specific metrics (e.g., belt rank, medical info) are mandatory?
2. **Payment Gateway:** Preferred provider (Stripe, etc.) and region-specific needs?
3. **Coach Roles:** What level of system access should coaches have compared to Admins?
4. **Digital Goods:** Hosting requirements for videos/PDFs (Secure vs. Public)?

---
*Last Updated: 2026-04-24*
