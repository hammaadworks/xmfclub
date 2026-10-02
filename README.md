# 🥋 xmfclub – Martial Arts Academy & Club Platform

**xmfclub** is the high-performance club management and digital portal for martial arts academies. Built with a modern responsive UI, Bento Grid architecture, TanStack Start, and Supabase.

---

## ✨ Features

- **Public Hub**: High-energy Bento Grid landing page, interactive training schedules, curriculum resources, and hall-of-fame showcase.
- **Member & Student Portal (`/member/$memberId`)**:
  - 5-digit PIN and physical QR/NFC credential authentication.
  - Attendance history and consecutive training streak metrics.
  - Belt progression tracker with required training session calculations.
  - Event registration and profile management.
- **Volunteer Data Entry Hub (`/xmform`)**:
  - Rapid student intake with auto-calculated age from date of birth.
  - Client-side canvas image compression to WebP (saving bandwidth and storage).
  - Live debounced phone duplicate detection.
  - Admin-only VIP / Custom ID allocation and Admin-only review/verification gating.
  - Real-time directory with multi-field search, status filtering, and soft-delete with undo.
- **Admin Command Center (`/admin`)**:
  - Member management with role assignments and fee status tracking.
  - Camera-based QR Code & NFC scanner for quick check-ins and profile lookups.
  - Event creation, attendee exports, and global belt/branch configurations.

---

## 🆔 Crockford Base32 Member ID Specification

Member IDs follow Douglas Crockford's Base32 encoding for human readability and error tolerance:
- **Format**: `XMF` + `YY` (2-digit joining year) + `ZZ` (2-digit Crockford Base32 sequence) $\rightarrow$ Fixed 7 characters (e.g. `XMF2601`).
- **Alphabet**: `0123456789ABCDEFGHJKMNPQRSTVWXYZ` (32 characters, excluding ambiguous `I, L, O, U`).
- **Human Error-Tolerant Decoding**: `O/o` $\rightarrow$ `0`, `I/i/L/l` $\rightarrow$ `1`, and `U/u` rejected to prevent accidental profanities.
- **Lowest Unused Gap Allocation**: Sequential allocation always picks the lowest available slot starting at `01`. If an Admin assigns a high VIP suffix (e.g. `XMF26ZZ`), regular sequential allocation continues seamlessly without skipping slots.
- **VIP / Custom Assignment**: `00` through `ZZ` can be custom-assigned exclusively by administrators with live collision detection.
- **Deleted ID Locking**: Soft-deleted IDs remain permanently reserved and are never recycled.
- **Spillover**: If all 1,024 slots for a year are exhausted, the engine automatically expands to 3 Crockford characters starting at `100` (e.g. `XMF26100`).

---

## 👥 System Roles

1. **`student`**: Regular academy student. Tracks attendance, belt promotions, and events.
2. **`instructor`**: Conducts classes, logs student attendance, and manages sessions.
3. **`volunteer`**: Rapidly registers students and manages intake at events and dojos.
4. **`admin`**: Full system control, financial oversight, verified status toggling, and VIP ID allocation.

---

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) / React 19 / TypeScript
- **Styling**: Tailwind CSS v4 & custom martial arts glassmorphism
- **Database & Storage**: [Supabase](https://supabase.com/) (PostgreSQL, Storage bucket `member-photos`)
- **Testing**: [Vitest](https://vitest.dev/)
- **Icons**: Lucide React

---

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Setup**:
   - Run `supabase/schema.sql` in your Supabase SQL Editor.
   - Run `supabase/seed.sql` to populate sample branches, belts, admin, instructor, and student accounts.

3. **Environment Configuration**:
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Launch Development Server**:
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:3331`.

5. **Run Tests**:
   ```bash
   npm run test
   ```

6. **Build for Production**:
   ```bash
   npm run build
   ```
