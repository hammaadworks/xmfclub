# Project Context: xmfclub

## 1. Brand Identity
- **Name:** xmfclub
- **Domain:** xmfclub.com
- **Vibe:** High-energy, intense, professional, futuristic.
- **Philosophy:** Repurposing "Extreme Martial Arts and Fitness" (XMF) into a modern, modular training platform.
- **Target Audience:** Middle schoolers, busy professionals, and personal trainers.

## 2. Business Systems & Scaling (Source: `SYSTEMS.md`)
- **Student Management:** Centralized tracking of progress, ranks, and attendance.
- **Payments:** Automated recurring billing and event-based collections.
- **Coach Portal:** Tools for class management and student grading.
- **Event Logistics:** Visitor management and streamlined fee collection for seminars/competitions.
- **Revenue:** Mixed model of memberships, affiliate marketing (Decathlon/Amazon), and proprietary digital/physical merch.

## 3. Design System (Source: `design-system/xmfclub/MASTER.md`)
- **Theme:** Dark Mode (Background: `#1F2937`)
- **Primary Color:** Energy Orange (`#F97316`)
- **Typography:** 
  - Headings: `Syncopate` (Kinetic/Motion feel)
  - Body: `Space Mono` (Tech/Futuristic feel)
- **Visual Style:** Bento grids, bold hover states, and high-contrast "Success Green" (`#22C55E`) for CTAs.

## 4. Technical Stack
- **Framework:** TanStack Start (React + TypeScript)
- **Styling:** Tailwind CSS + Vanilla CSS for custom animations.
- **Authentication:** Better Auth (already partially integrated).
- **Icons:** Lucide React.
- **Components:** shadcn/ui.

## 5. Feature Roadmap

### Phase 1: Foundation & Brand (Complete)
- [x] Home Page (Bento Grid)
- [x] Design System (Energy Orange / Dark Mode)
- [x] About/Mission Page (Initial)

### Phase 2: Curriculum & Alacarte (In Progress)
- [x] 2-Level Nested Selection
- [ ] Pay-per-module Checkout Flow
- [ ] Student Onboarding

### Phase 3: Community & Business Systems
- [ ] **SMS Core:** Basic student profiles and rank tracking.
- [ ] **Payments:** Recurring billing integration.
- [ ] **Achievements (Hall of Fame):** Celebrating student gold medalists and wins.
- [ ] **Events:** Timeline + Visitor registration system.
- [ ] **Coach Management:** Instructor assignment and attendance marking.

### Phase 4: Vertical Store (E-commerce)
- [ ] **Reels-Style Feed:** Mobile-first vertical scroll for merch and affiliate products.
- [ ] **Affiliate Integration:** Amazon/Decathlon redirect system.
- [ ] **Digital Resources:** Secure portal for training materials and courses.

## 5. Business Logic
- **Monetization:** Pay-per-module for training. Affiliate commissions for gear.
- **Growth:** Social-first funnel driving users to the alacarte curriculum.
- **Enrollment Policy (Commit-on-Payment):**
  - Capacity check happens at order creation (pre-flight).
  - Slot enrollment count increments only after successful payment (webhook/offline log).
  - Risk: Rare race conditions causing over-booking are accepted; resolved manually via admin dashboard.
  - No temporary reservation/locking of slots.


---
*Next Step: Building the Landing Page with the new design system.*
