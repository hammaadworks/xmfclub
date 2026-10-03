# Implementation Plan: In-Context Member Credential Linking & Responsive Roster

**Date**: 2026-10-03  
**Design Reference**: [`docs/plans/2026-10-03-admin-credential-linking-design.md`](file:///Users/alhamdulillah/codespace/xmfclub/docs/plans/2026-10-03-admin-credential-linking-design.md)  
**Target Completion**: Complete end-to-end integration with zero ambiguity  

---

## Task Checklist & Milestones

### Phase 1: Core Logic & Validation Utilities
- [ ] **Task 1.1**: Create `src/lib/uidFormatter.ts`
  - Implement `formatAndValidateHexUid(input: string)`:
    - Strips all non-hex characters `[^0-9A-Fa-f]`.
    - Converts to uppercase.
    - Validates length for 4-byte (8 hex chars) or 7-byte (14 hex chars).
    - Formats into standard colon-delimited pairs (`XX:XX:XX:XX` or `XX:XX:XX:XX:XX:XX:XX`).
  - Implement `autoFormatHexInput(raw: string)`:
    - Real-time formatter for input `onChange` handlers (auto-uppercases, limits to 14 hex chars, inserts colons on the fly).
- [ ] **Task 1.2**: Create unit tests in `src/lib/uidFormatter.test.ts`
  - Test valid 4-byte (`04A35B1C` $\rightarrow$ `04:A3:5B:1C`).
  - Test valid 7-byte (`04A32B1C885D80` $\rightarrow$ `04:A3:2B:1C:88:5D:80`).
  - Test lowercase hex and pre-existing colons or hyphens (`04-a3-2b...`).
  - Test invalid lengths (3-byte, 5-byte, 8-byte) with informative error messages.
  - Run `npm run test` and ensure all tests pass.

---

### Phase 2: Reusable Credential Controls & Modals
- [ ] **Task 2.1**: Build `src/components/credentials/MemberCredentialControls.tsx`
  - **Props**:
    - `memberId: string`
    - `memberName: string`
    - `assignedQrcs: MemberCredentialItem[]`
    - `assignedTags: MemberCredentialItem[]`
    - `onChanged: () => void` (callback to reload member roster data)
  - **Features**:
    - **Active Badges Display**:
      - QR Badge pills: token, preview link, unlink button.
      - NFC Tag pills: token, formatted physical UID, inline `Edit UID` button, unlink button.
    - **Inline UID Editor**:
      - Click `Edit UID` $\rightarrow$ shows text input pre-filled with current UID + `Save` and `Cancel` buttons.
      - Auto-formats colons via `autoFormatHexInput`.
      - On save, validates via `formatAndValidateHexUid` and runs `supabase.from('credentials').update({ physical_uid: formatted }).eq('id', credId)`.
    - **Unlink Audit Dialog**:
      - When clicking trash/unlink on any badge, open confirm modal:
        - "Return to Pool as Free" (`status = 'free'`, `unassigned_at = now()`)
        - "Mark Damaged/Lost (Retire)" (`status = 'deleted'`, `rejection_reason = 'damaged/lost'`)
    - **Add QR Badge Flow (3 Tabs)**:
      1. *Free Lot*: Fetches free QR tokens from `credentials` where `type = 'qrc' AND status = 'free'` order by token. 1-click "Assign Token [X]".
      2. *Camera Scan*: Uses `@yudiel/react-qr-scanner`. Decodes URL or raw token, validates exists and is free, assigns.
      3. *Manual Token*: Crockford Base32 input. Validates Crockford, verifies free status, assigns.
    - **Add NFC Tag Flow (3 Tabs)**:
      1. *Free Lot + Enter UID*: Grabs next free tag token and prompts for physical Hex UID with auto-colon formatting.
      2. *Tap Tag (Web NFC)*: On supported Android Chrome devices, invokes `new NDEFReader()` to write URL and read hardware UID in one tap.
      3. *Manual Token + UID*: Inputs for both Crockford token and Physical Hex UID.
    - **Anti-Hijack & Inventory Guards**:
      - If token is assigned to another member: display `"Token [TOKEN] is already assigned to [Member Name] ([ID]). Unlink it from their profile first."`
      - If token is not in `credentials`: display `"Token not found in inventory. Please generate or register it in Credentials Hub first."`

- [ ] **Task 2.2**: Build `src/components/credentials/QuickCredentialModal.tsx`
  - Clean floating modal / mobile bottom-sheet wrapping `MemberCredentialControls` for instant access from roster chips.

---

### Phase 3: Responsive Member Roster (Mobile Cards + Desktop Table)
- [ ] **Task 3.1**: Build `src/components/admin/MemberRosterCard.tsx`
  - Rendered when viewport is `< 768px` (`md:hidden`).
  - High-density martial arts club member card:
    - Header: Avatar image or initials, Monospace Member ID with quick copy button, Full Name, Belt badge (styled according to belt color).
    - Status pills: Verification (`Verified` / `Pending Review` with 1-tap toggle), Fee pill (`Paid` / `₹X Due`), Remarks indicator dot.
    - Credentials bar:
      - Active QR chips (`[QR: 00001A]`) and NFC chips (`[NFC: 00001B]`).
      - Empty slot triggers (`[+ Link QR]` and `[+ Link NFC]`).
      - Tapping any chip opens `QuickCredentialModal`.
    - Action bar: `Edit Member` (opens full edit modal), `Archive/Restore`, `Open Profile`.
- [ ] **Task 3.2**: Update Desktop Table in `src/routes/admin/index.tsx`
  - Rendered when viewport is `>= 768px` (`hidden md:block`).
  - Add new column: **"Badges"** between "Belt / Role" and "Verification".
  - Shows active chips with hover tooltip for 7-byte UID and quick-link pills.
  - Clicking pills opens `QuickCredentialModal`.

---

### Phase 4: Integration in Admin Command Center (`src/routes/admin/index.tsx`)
- [ ] **Task 4.1**: Update `loadMembers()` to fetch active `credential_assignments` and join `credentials`.
- [ ] **Task 4.2**: Add the new "Credentials & Badges" accordion inside the `Edit Member` modal (`showEditModal`), embedding `MemberCredentialControls`.
- [ ] **Task 4.3**: Integrate `QuickCredentialModal` for direct roster actions without needing to open the full edit modal.
- [ ] **Task 4.4**: Switch roster list to render `MemberRosterCard` on mobile and table on desktop.

---

### Phase 5: Verification & Playwright Responsive Testing
- [ ] **Task 5.1**: Automated test suite: `npm run test`
- [ ] **Task 5.2**: Strict TypeScript compile check: `npx tsc -b`
- [ ] **Task 5.3**: Production build: `npm run build`
- [ ] **Task 5.4**: Playwright MCP Visual Emulation:
  - Mobile viewport (`390 x 844`):
    - Verify card layout, zero horizontal scroll, tap targets, modal bottom sheet.
    - Test assigning QR from free lot and typing physical UID with auto-colons.
  - Desktop viewport (`1440 x 900`):
    - Verify table column alignment, hover tooltips for 7-byte UID.
    - Test Edit Member modal accordion, inline UID edit, and unlink confirmation.
