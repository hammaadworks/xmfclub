## Goal Description
Implement the Reusable Hardware Credential System (`qrc` & `tag`) as outlined in `docs/plans/qrctag.md`. This includes database schema consolidation (replacing `id UUID` with `member_id TEXT` as primary key), adding physical credential management tables, creating reusable credential assignment flows, and generating print-ready 4x8 QR batches and NFC tags.

## Proposed Changes

### Database (Supabase)
#### [MODIFY] supabase/schema.sql
- Modify `public.members` table: completely remove `id UUID`, making `member_id TEXT PRIMARY KEY`.
- Modify `public.attendance` and `public.event_registrations`: change `member_id` from UUID to `TEXT`, update foreign keys to reference `members(member_id)`.
- Add sequences: `qrc_batch_seq`, `tag_batch_seq`.
- Add tables: `credential_batches`, `credentials`, `credential_assignments`.
- Add required indexes and Row Level Security (RLS) policies.

#### [MODIFY] supabase/seed.sql
- Update `INSERT INTO public.members` to remove all UUIDs, keeping only `member_id` (e.g. `XMF2001`).
- Update `INSERT INTO public.attendance` and `public.event_registrations` to use the corresponding `member_id` strings (e.g. `XMF2601`) instead of UUIDs.

---

### Core Libs
#### [NEW] src/lib/credentialToken.ts
- Expose `BATCH_SIZE = 32`.
- `calculateBatchTokens(batchNumber)` generating 32 Base32 tokens using `src/lib/crockford.ts`.
- `parseCredentialToken(token)`.
- `buildCredentialUrl(type, token)`.

#### [NEW] src/lib/qrLayout.ts
- Logic for rendering 4x8 grids of QR codes onto A4 size.
- Export to Vector PDF via `jspdf`.
- Export to SVG ZIP via `jszip`.

---

### Frontend Refactoring (UUID -> member_id)
#### [MODIFY] src/routes/member/$memberId.tsx
- Replace all instances of `member.id` with `member.member_id` across data fetching, insertions, and component keys.
- Add "Physical Credentials" card to sidebar.

#### [MODIFY] src/routes/admin/index.tsx
- Replace all instances of `m.id` / `member.id` with `m.member_id`.
- Add `Credentials Hub` sub-tab (Inventory, Generate QRC Batch, NFC Provisioning).
- Update Scanner Pattern Matcher to support `/qrc/000000`, `/tag/000000`, and raw `000000` tokens.

#### [MODIFY] src/routes/login.tsx & src/routes/events.tsx
- Update any lingering `user.id` or `member_id` usages related to the auth/session logic if they query the UUID.

---

### New Routes & Components
#### [NEW] src/routes/qrc/$token.tsx
- Loader queries `credential_assignments` and redirects to `/member/$memberId` if assigned, else displays unassigned status.

#### [NEW] src/routes/tag/$token.tsx
- Same logic as QRC, but for NFC tags.

#### [NEW] src/components/credentials/CredentialAssignmentModal.tsx
- Shared glassmorphism modal for Assign, Reassign, Unassign, and Delete flows.

#### [NEW] src/components/credentials/NfcProvisionerModal.tsx
- **Android Chrome**: Uses `window.NDEFReader` to encode and verify URLs onto physical NFC tags natively.
- **iOS / Desktop Fallback**: Detects missing `window.NDEFReader` and displays a manual fallback UI with an input field, allowing staff to copy the UID from a third-party "NFC Reader" app and paste it directly into our web app for zero-friction assignment.

---

## Verification Plan

### Automated Tests
1. Write and run unit tests for the token generator: `npm run test`
2. Ensure strict type safety: `npx tsc -b`
3. Ensure successful build: `npm run build`

### Manual Verification
1. Run `node test-db.cjs` (or paste into Supabase dashboard) to reset the database and seed it successfully without foreign key errors.
2. Open `/admin`, navigate to "Credentials Hub".
3. Click "Generate Batch of 32" and download the PDF. Verify a 4x8 layout of QR codes.
4. Open a member profile (`/member/XMFYYZZ`), assign a `free` credential from the generated batch.
5. In the NFC Provisioner on Desktop, verify that the manual UID copy-paste input field is presented correctly.
6. Scan or navigate to `/qrc/000000` (the generated credential) and verify it redirects back to the correct member profile.
7. In `/admin`, verify the Scanner successfully intercepts `/qrc/000000` strings and routes appropriately.
