# XMFClub Pilot Demo - Product Requirements Document (PRD)

## 1. Overview & Scope
This document outlines the requirements for the XMFClub Pilot Demo application. Due to a 2-day deadline, the application will bypass a traditional Python backend and use a JS-only stack communicating directly with Supabase. 
- **Frontend Stack:** TanStack Start (React, TypeScript), Tailwind CSS, Shadcn UI.
- **Backend/Database:** Supabase (PostgreSQL, direct client-side querying).
- **Deployment:** Vercel.
- **Design System:** Must strictly follow the existing landing page theme.

## 2. Entities & Roles
The system has two primary roles:
1. **Admin:** Full CRUD access. Can create/manage members, create events, upload syllabus, and log student attendance via scanning.
2. **Student:** Can log in to view their private profile, register for events relevant to their belt, view the belt syllabus, and see their roadmap to Black Belt.

## 3. Identification & Authentication
### 3.1. Member ID Generation
No UUIDs will be exposed on physical cards. Instead, a custom Member ID is used across the system.
- **Format:** `XCyy0000` (e.g., `XC260001`)
  - `XC`: Standard prefix for XMFClub community.
  - `yy`: 2-digit year of joining (e.g., `26` for 2026).
  - `0000`: 4-digit sequential enrollment counter per year.

### 3.2. Login Mechanism
- **Supported Identifiers:** Users can log in using their `member_id`, `phone_number`, or `email`.
- **Pattern Lock:** Standard password fields are replaced with a **3x3 Grid Pattern Lock** (indices 0-8). 
- **Storage:** The sequence string (e.g., `"048526"`) is stored as a plain string directly in a custom Supabase table for the pilot demo. `better-auth` is intentionally omitted for this custom implementation.
- **Default Pattern:** When an Admin creates a new member, the default pattern is set to `"048526"` (visually representing an 'X' shape).

## 4. Hardware Integrations (NFC & QR)
- Physical student ID cards will feature the student's Photo, Name, and a printed QR code. 
- **NFC/QR Payload:** Contains a public URI routing to `xmfclub.com/[member_id]`.
- **Native Scan:** Scanning with a standard phone camera/NFC reader opens the public profile view.
- **App Scanner:** The web app will feature an in-app camera scanner module. When an Admin scans a card via this module, it will log attendance.

## 5. Core User Interfaces & Workflows

### 5.1. Public Scan Profile (`/[member_id]`)
Accessible to anyone who scans the card natively (without being logged in as an Admin). Displays restricted public details only:
- Name, Photo, Belt, Member Status (Active/Inactive), Branch, Blood Group, Achievements, Date of Joining, Date of Leaving (if inactive).

### 5.2. Admin App Scanner & Member Profile (`/scan` and `/[member_id]`)
- **App Scanner:** The web app will feature an in-app camera scanner module. 
- **Admin View:** When an Admin scans a card via this module (or navigates to a student's profile), they are shown the **Full Details Page** (Public + Private details combined).
- **Attendance Logging:** On this Full Details Page, there is a prominent "Mark Attendance" button. Clicking this logs the student's attendance for the day.
- **Member Management:** View a master list of all members. Form to create a new member (Admin selects role: 'Student' or 'Admin'). The generated `member_id` is immediately shown upon creation.
- **Event Management:** Create events targeted at specific belts. Include fee breakup, FAQs, and custom registration questions. View form responses.
- **Syllabus Management:** Upload/link video syllabus content tied to specific belts.

### 5.3. Student Dashboard
Accessible to students after login.
- **Full Profile Management:** View full profile (Public + Private details). Edit Phone, Email, Address. View private Instructor Remarks, Fee Status.
- **Pattern Reset:** Students have a settings option to change their pattern lock while logged in.
- **Attendance Calendar:** A section displaying their private attendance history visualized on a calendar.
- **Belt Roadmap:** Visual roadmap showing the 18-month path to Black Belt.
- **Syllabus:** View video syllabus. **Logic:** Student can only see videos assigned to their current belt level or lower. 90D Exclusive Pro content requires premium status.
- **Event Registration:** View and register for upcoming events that match their belt level.

## 6. Payments & Unimplemented Features (Fallback Modal)
For the 2-day pilot demo, actual payment gateways and highly complex state updates are deferred. 
- **Universal Fallback:** Any "Pay" button or complex unimplemented action will trigger a standard modal overlay.
- **Modal Content:** `"Contact Master Farhan 8884503703 for more info / payments"`
- The phone number must be a clickable `tel:8884503703` link to initiate a call immediately.

## 7. Database Schema (Supabase)
*Note: This is a high-level representation of the tables to be created in Supabase SQL.*

1. **`members`**
   - `id` (UUID, primary key)
   - `member_id` (String, unique, e.g., XC260001)
   - `role` (Enum: admin, student)
   - `pattern_string` (String, plain string 3x3 sequence)
   - `name`, `phone` (unique), `email` (unique), `photo_url`, `blood_group`, `belt`, `address`, `branch`, `member_status`
   - `date_of_joining`, `date_of_leaving`
   - `achievements`, `instructor_remarks`, `fee_status`

2. **`attendance`**
   - `id`, `member_id` (FK), `timestamp`

3. **`events`**
   - `id`, `title`, `description`, `target_belt`, `fee_breakup`, `faqs`, `custom_questions`

4. **`event_registrations`**
   - `id`, `event_id` (FK), `member_id` (FK), `form_responses` (JSONB)

5. **`syllabus`**
   - `id`, `belt_level`, `title`, `video_url`, `is_premium`

## 8. Open Questions & Assumptions (For Clarification)
1. **Root Admin Setup:** We will manually seed the initial Root Admins directly in the Supabase database.
   - *Master Farhan*: Admin, 8884503703
   - *Mohammed Hammaad*: Admin, 9663527755, Member ID: XC260002, Pattern: 0367852
2. **Pattern Reset Flow:** 
   - If a logged-out user clicks "Forgot Pattern", a modal appears instructing them to contact Master Farhan to reset it.
   - An Admin can click a "Reset Pattern" button on the user's profile, reverting it to the default 'X' pattern (`048526`).
   - The user then logs in with the default pattern and uses the Student Dashboard to change it to a new secure pattern.

## 9. Progress & Hand-off Notes (Session Checkpoint)
This section documents the current state to ensure a seamless hand-off for the next session.

### What is Completed:
1. **Database Schema & Auth Pivot:** Supabase Auth dependencies (`better-auth`) are fully removed. Custom `members` table is active. The login system uses `member_id` + `pattern_string` (stored as plain text for the pilot). 
2. **Login Screen (`/login`):** Fully operational. Verifies member, stores session in `localStorage('xmf_member')`, and navigates to `/dashboard`.
3. **Global Fallback Modal:** A reusable `<ContactModal />` is integrated at `__root.tsx`. It triggers on custom event `showContactModal`. Used everywhere for "Forgot Pattern", "Join the Club", and unimplemented payment flows.
4. **Public Site Polish:** 
   - Unified `/contact` and `/social` into a single `/connect` page.
   - Cleaned up nav bars and sidebars to strictly match the PRD.
   - Fixed images across the site, using highly reliable Unsplash URLs.
   - Added appropriate CTA / Coming Soon callouts to Events, Store, and Resources.

### To-Do For Next Session (Priority Order):
1. **Student Dashboard (`/dashboard`):** `login.tsx` currently routes here upon success. We need to build this route! It must read `localStorage` to get the logged-in user, and display the student's profile (Private/Public fields editable, Fee Status, Instructor Remarks).
2. **Attendance Calendar Integration:** Embed a simple calendar within the Student Dashboard showing their past attendance (pulling from `attendance` table).
3. **Admin Dashboard (`/admin`):** Secure route (role-check) for Admins. Must include:
   - A master list of members.
   - A form to create new members (auto-generating `XC26xxxx` IDs).
4. **Public & Admin Scan Views (`/[member_id]`):** 
   - If a guest visits, show read-only public data.
   - If an Admin visits (or scans a card via an in-app scanner), show Full Data + "Mark Attendance" button.
