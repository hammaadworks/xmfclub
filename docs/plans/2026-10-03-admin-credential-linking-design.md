# Design Document: Holistic Admin Member Credential Linking & In-Context Controls

**Date**: 2026-10-03  
**Status**: Approved & Fully Specified  
**Topic**: Admin Command Center In-Context QRC & NFC Tag Linking, Physical UID Management, and Responsive Roster UX  

---

## 1. Problem Statement & Motivation
Currently in the XMF Club Admin Command Center:
1. To assign or manage QR badges or NFC tags for members, an administrator has to navigate away from the Member Roster, open the "Credentials Hub" tab, search for an available token, search for the member, and confirm the assignment.
2. Inside the "Edit Member" modal, there are zero controls or visibility for what QR code or NFC tag is currently linked to that member.
3. When linking an NFC tag, there is no direct, in-context field to enter or scan the physical hardware UID (e.g. 7-byte / 4-byte hex) from the edit controls.
4. On mobile screens, the member roster table forces awkward horizontal scrolling, requiring multiple taps and screen hopping to perform standard check-in or badge assignment tasks.

The goal is a **holistic, in-context credential management system** that eliminates screen switching, minimizes clicks on both PC and mobile, and provides a 5000% better UX.

---

## 2. Requirements & Business Rules

### 2.1 Credential Assignment Rules
- **Multi-Credential Support**: Members can hold multiple active QR codes and/or NFC tags simultaneously (e.g., primary badge + backup wristband / family badge).
- **Anti-Hijack Guard**: If staff enters or scans a token already assigned to another member, assignment is **strictly blocked** with an explicit error:
  `"Token [TOKEN] is already assigned to [Member Name] ([ID]). Unlink it from their profile first."`
- **Strict Inventory Control**: If a scanned or entered token does not exist in the `credentials` table, it is rejected:
  `"Token not found in inventory. Please generate or register it in Credentials Hub first."`
- **Strict Physical Hex UID Format**:
  - Tag physical hardware UIDs must adhere to standard 4-byte (`8 hex chars` $\rightarrow$ `XX:XX:XX:XX`) or 7-byte (`14 hex chars` $\rightarrow$ `XX:XX:XX:XX:XX:XX:XX`).
  - Input field automatically sanitizes input (stripping whitespace, non-hex characters, uppercase conversion, and auto-inserting colons after every 2 hex characters).
- **Unlink Audit Prompt**: Unlinking a credential prompts the admin with two explicit options:
  1. *Return to Pool as Free* (`status = 'free'`, `unassigned_at = now()`).
  2. *Mark Damaged / Lost / Retired* (`status = 'deleted'`, `rejection_reason = 'damaged/lost'`).

---

## 3. Architecture & Data Flow

### 3.1 Data Structures & TypeScript Interfaces
```ts
export interface MemberCredentialItem {
  id: string;              // credentials.id (UUID)
  assignmentId: string;    // credential_assignments.id (UUID)
  token: string;           // 6-char Crockford Base32
  type: 'qrc' | 'tag';
  status: 'free' | 'assigned' | 'deleted';
  physical_uid: string | null; // e.g. "04:A3:2B:1C:88:5D:80"
  assigned_at: string;
}

export interface MemberWithCredentials {
  member_id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'student' | 'instructor' | 'volunteer' | 'admin';
  belt: string;
  branch: string;
  photo_url?: string | null;
  blood_group?: string;
  member_status: 'Active' | 'Inactive';
  fee_status: 'Paid' | 'Pending';
  pending_amount?: number;
  is_reviewed: boolean;
  is_deleted: boolean;
  instructor_remarks?: string;
  instructor_remarks_color?: string;
  assignedQrcs: MemberCredentialItem[];
  assignedTags: MemberCredentialItem[];
}
```

### 3.2 Batch Data Loading
Update `loadMembers` in `src/routes/admin/index.tsx` to fetch active credential assignments in a single query:
```ts
const { data, error } = await supabase
  .from('members')
  .select(`
    *,
    credential_assignments!credential_assignments_member_id_fkey (
      id,
      credential_id,
      assigned_at,
      unassigned_at,
      credentials (
        id,
        token,
        type,
        status,
        physical_uid
      )
    )
  `)
  .order('created_at', { ascending: false });

// Transform and extract active credentials:
const enrichedMembers = (data || []).map(m => {
  const activeAssignments = (m.credential_assignments || []).filter((a: any) => !a.unassigned_at && a.credentials);
  const qrcs: MemberCredentialItem[] = [];
  const tags: MemberCredentialItem[] = [];

  for (const a of activeAssignments) {
    const credItem: MemberCredentialItem = {
      id: a.credentials.id,
      assignmentId: a.id,
      token: a.credentials.token,
      type: a.credentials.type,
      status: a.credentials.status,
      physical_uid: a.credentials.physical_uid,
      assigned_at: a.assigned_at,
    };
    if (a.credentials.type === 'qrc') qrcs.push(credItem);
    else if (a.credentials.type === 'tag') tags.push(credItem);
  }

  return {
    ...m,
    assignedQrcs: qrcs,
    assignedTags: tags,
  };
});
```

### 3.3 Database Operations & Mutations
1. **Assign Credential to Member**:
   ```ts
   // Update credential status & physical UID (if tag)
   await supabase
     .from('credentials')
     .update({ 
       status: 'assigned',
       ...(physicalUid ? { physical_uid: physicalUid } : {})
     })
     .eq('id', credentialId);

   // Insert new active assignment
   await supabase
     .from('credential_assignments')
     .insert({
       credential_id: credentialId,
       member_id: memberId,
       assigned_at: new Date().toISOString(),
     });
   ```

2. **Unlink Credential**:
   ```ts
   // Close active assignment
   await supabase
     .from('credential_assignments')
     .update({ unassigned_at: new Date().toISOString() })
     .eq('id', assignmentId);

   // Update credential status
   if (action === 'free') {
     await supabase.from('credentials').update({ status: 'free' }).eq('id', credentialId);
   } else if (action === 'retire') {
     await supabase
       .from('credentials')
       .update({ status: 'deleted', rejection_reason: 'damaged/lost' })
       .eq('id', credentialId);
   }
   ```

3. **Inline Update Physical UID**:
   ```ts
   await supabase
     .from('credentials')
     .update({ physical_uid: formattedHexUid })
     .eq('id', credentialId);
   ```

---

## 4. Physical Hex UID Validation & Auto-Formatting

A dedicated helper function `src/lib/uidFormatter.ts` handles clean parsing and formatting:
```ts
export function formatAndValidateHexUid(input: string): {
  valid: boolean;
  formatted: string;
  error?: string;
} {
  // Strip non-hex characters (keep only 0-9, A-F)
  const clean = input.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();

  // Allow 4-byte (8 hex chars) or 7-byte (14 hex chars)
  if (clean.length !== 8 && clean.length !== 14) {
    return {
      valid: false,
      formatted: input,
      error: `Physical UID must be 4-byte (8 hex digits) or 7-byte (14 hex digits). Current: ${clean.length} digits.`,
    };
  }

  // Format with standard colons: XX:XX:XX:XX or XX:XX:XX:XX:XX:XX:XX
  const formatted = clean.match(/.{1,2}/g)?.join(':') || clean;
  return {
    valid: true,
    formatted,
  };
}

export function autoFormatHexInput(raw: string): string {
  const clean = raw.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 14);
  const parts = clean.match(/.{1,2}/g) || [];
  return parts.join(':');
}
```

---

## 5. UI / UX Design & Responsive Layout

### 5.1 Roster: Desktop Table vs. Responsive Mobile Cards
- **Desktop View (`>= 768px`)**:
  - A new **"Badges"** column in the roster table.
  - Interactive chips:
    - `[QR: 00001A]` (green accent)
    - `[NFC: 00001B • 04:A3..]` (blue accent with full UID tooltip)
    - `[+ QR]` / `[+ NFC]` compact action pills for unlinked slots.
  - Clicking any chip opens the **Quick Credential Action Sheet**.
- **Mobile View (`< 768px`)**:
  - Touch-optimized **Member Cards** replacing table horizontal scroll.
  - Each card includes:
    - Member header (Avatar, ID with copy button, Name, Belt, Status).
    - Status badges (Verification review button, Payment status).
    - Touch-sized credential bar with active badge chips and `+ Link QR` / `+ Link NFC` triggers.
    - Quick actions: Edit Member, Archive/Restore, External Profile link.

### 5.2 Inside Edit Member Modal: "Credentials & Badges" Section
Add an accordion section **"Credentials & Badges"**:
- Displays all currently assigned QR badges & NFC tags.
- For NFC tags:
  - Displays Crockford token and formatted Physical UID (`XX:XX:XX:XX:XX:XX:XX`).
  - Inline `Edit UID` button: toggles inline input with instant `Save` / `Cancel`.
- Unlink button with confirmation modal (Return to Free Pool vs. Retire).
- Direct linking buttons:
  - `+ Link QR Badge`
  - `+ Link NFC Tag`

### 5.3 Three Symmetrical Linking Workflows

#### QR Badge Linking
1. **Choose from Free Lot**:
   - Preview next available free token with 1-click "Assign Now".
   - Searchable list of all free QR tokens.
2. **Scan with Camera**:
   - Quick popover camera scanner.
   - Decodes QR code URL (`/qrc/:token`) or raw 6-character Crockford token.
   - Verifies token is free in inventory and assigns in real time.
3. **Enter Token**:
   - 6-character Crockford Base32 text input.
   - Real-time inventory check and status validation.

#### NFC Tag Linking
1. **Choose from Free Lot + Enter UID**:
   - Auto-selects next available free tag token.
   - Direct formatted input for **Physical Hex UID** (4-byte or 7-byte).
2. **Tap Tag (Web NFC)**:
   - For Web NFC-enabled devices (Android Chrome).
   - Staff taps "Activate NFC Reader".
   - Tapping physical tag captures hardware UID and programs NDEF URL in one action.
3. **Manual Token & UID**:
   - Inputs for both Crockford token and Physical Hex UID.
   - Full inventory & anti-hijack checks before saving.

---

## 6. Implementation Plan & File Architecture

### 6.1 Component Architecture
1. `src/lib/uidFormatter.ts`:
   - Hex UID validation, cleaning, and auto-colon formatting.
2. `src/lib/uidFormatter.test.ts`:
   - Unit tests covering 4-byte, 7-byte, invalid lengths, lowercase hex, whitespace, and colon normalization.
3. `src/components/credentials/MemberCredentialControls.tsx`:
   - The unified credential management section used both inside `Edit Member` modal and standalone quick linker.
   - Handles active badges list, inline UID editing, unlink modal, and 3-tab assignment flows.
4. `src/components/credentials/QuickCredentialModal.tsx`:
   - Lightweight modal opened when clicking badge chips from the roster table or mobile cards.
5. `src/components/admin/MemberRosterCard.tsx`:
   - Responsive mobile card rendering on screens `< 768px`.
6. `src/routes/admin/index.tsx`:
   - Integrate batch query with `credential_assignments`.
   - Add "Badges" column to desktop table.
   - Render `MemberRosterCard` list on mobile.
   - Embed `MemberCredentialControls` in `Edit Member` modal.

---

## 7. Verification Plan & Playwright MCP Instructions

### 7.1 Playwright MCP Responsive Inspections
1. **Mobile Viewport (`390 x 844`)**:
   - Navigate to `/admin`.
   - Verify mobile cards render smoothly with zero horizontal table scroll.
   - Click `+ Link QR` on a member card $\rightarrow$ verify bottom sheet opens.
   - Test camera scan and manual token tabs.
   - Click `+ Link NFC` $\rightarrow$ test auto-colon formatting when typing `04A32B1C885D80`.
2. **Tablet Viewport (`768 x 1024`)**:
   - Verify card/table layout switch and modal responsiveness.
3. **Desktop Viewport (`1440 x 900`)**:
   - Verify "Badges" column in table.
   - Hover on NFC badge chip $\rightarrow$ verify full 7-byte UID tooltip.
   - Open Edit Member modal $\rightarrow$ expand "Credentials & Badges" accordion $\rightarrow$ test inline UID editing.

### 7.2 Automated Suite
- `npm run test` (Vitest unit tests)
- `npx tsc -b` (Strict TypeScript check)
- `npm run build` (Production build check)
