# GEMINI.md

## Project Overview

**xmfclub** is the unified frontend and management interface for a martial arts club.
- **Frontend**: TanStack Start (React, TypeScript), Tailwind CSS, Shadcn/UI.
- **Database & Storage**: Supabase (PostgreSQL with RLS, storage bucket `member-photos`).
- **Infrastructure**: Vercel/Netlify (Static/SSR deployment).

## Setup Commands

- **Install Dependencies**: `npm install`
- **Run Development Server**: `npm run dev` (Runs on port 3331)
- **Run Tests**: `npm run test` (Vitest unit tests)
- **Type Check**: `npx tsc -b`
- **Build for Production**: `npm run build`

## Member ID Specifications (Crockford Base32)

- **Template**: `XMFYYZZ` (Fixed 7 characters).
  - `YY`: 2-digit year of joining (e.g. `26` for 2026).
  - `ZZ`: 2-character Douglas Crockford Base32 sequence (`0-9`, `A-Z` excluding `I, L, O, U`).
- **Sequence Rules**:
  - Sequential generation starts from `01` (`00` is reserved for Admin manual VIP assignment).
  - Uses the **Lowest Unused Gap** algorithm (`src/lib/idGenerator.ts`).
  - Soft-deleted IDs are permanently locked and never recycled.
  - Spillover occurs to 3 characters (`XMFYY100`, 8 chars) only if all 1,024 slots for that year are exhausted.
- **Decoding Aliases**: `O` $\rightarrow$ `0`, `I`/`L` $\rightarrow$ `1`. Reject `U`.

## System Roles & Permissions

- **Roles**: `student`, `instructor`, `volunteer`, `admin`.
- **Review / Verification**: Only `admin` can review/verify records (`is_reviewed`). Volunteers and instructors have read-only visibility into verification status.
- **Custom ID Assignment**: Only `admin` can assign custom VIP suffixes (`00` to `ZZ`).
- **Staff Attendance Authorization**: Both `admin` and `instructor` can mark/log attendance.

## Engineering Standards
- **Clean Code**: Adhere to Clean Code principles (S.O.L.I.D, DRY, KISS).
- **Type Safety**: Maintain strict type safety in TypeScript with zero errors on `npx tsc -b`.
- **Testing**: Maintain passing unit test suite with `npm run test`.
- **No Legacy Stale Code**: Do not leave legacy formats (`XC`, `TRN`, `XMF260001`, `trainer`) lingering in the codebase.

## Development Workflow
- Frontend runs on port 3331 (`npm run dev`).
- Always verify changes with `npm run test && npx tsc -b && npm run build`.
