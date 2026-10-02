# 5-Digit PIN Login Authentication Design

## Overview
Replace the tedious 3x3 pattern lock with a fast, mobile-optimized 5-digit PIN code system for all XMFClub members and staff.

## Architecture & Database Changes
- **Target Table:** `public.members`
- **Authentication Column:** `password TEXT NOT NULL DEFAULT '12345'` (renamed from `pattern_hash` / temporary `pin_code`).
- **Address PIN Code Column:** `pin_code TEXT` (stores residential postal / PIN code).
- **Seed Data:** All seeded users in `supabase/seed.sql` have their initial password set to `'12345'`, and valid sample postal codes in `pin_code`.

## Component Design
1. **`PinPad.tsx` (New Component)**
   - Replaces `PatternLock.tsx`.
   - Renders a clean, iOS-style custom 10-key numeric pad (0-9 + Backspace) on the screen.
   - Prevents native mobile keyboards from popping up and distorting the UI.
   - Displays 5 dot indicators `( • • • ◦ ◦ )` to show input progress.
   - Triggers an `onComplete(pin: string)` callback instantly when the 5th digit is tapped.

2. **`Login.tsx` (Route)**
   - **Step 1:** Identifier input (unchanged).
   - **Step 2:** Replaces `<PatternLock />` with `<PinPad />`.
   - **Verification:** Calls Supabase `eq('member_id', id).eq('password', pin)`.

## Error Handling
- Visual shake animation or red text if the PIN is incorrect.
- Clears the PIN dots automatically on failure so the user can immediately try again.

## Security
- PINs are treated as plain text strings (`'12345'`) just like the old patterns, given the threat model of a physical club environment where quick attendance is prioritized over cryptographic hashing.
