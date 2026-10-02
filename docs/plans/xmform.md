# Comprehensive Implementation Plan: Volunteer Data Entry Hub (`/xmform`)

This document is the definitive specification and step-by-step implementation blueprint for the **Volunteer Data Entry Hub** at `/xmform`. It serves volunteers and instructors on any device (phone, tablet, PC) for rapid student intake, sequential `XMFYYZZ` (Crockford Base32) ID generation, client-compressed photo uploads, and complete roster management (search, multi-field filtering, pagination, edit, and soft-delete).

---

## 1. Core Architecture & Route Specifications

- **Target Route File**: `src/routes/xmform.tsx`
- **Route Registration**: TanStack Router `createFileRoute('/xmform')`
- **Navigation Exposure**:
  - Desktop Navigation Bar: Add `XMForm` item in `src/components/Header.tsx`.
  - Mobile Drawer Menu: Add `XMForm` item with an icon (e.g. `ClipboardList` or `UserPlus`) in `src/components/Header.tsx`.
- **Styling Architecture**:
  - Follows existing martial arts club aesthetic: `glass-card` styling, `bg-background`, `border-white/10`, primary gold/amber accents, high-contrast monospace typography for roll numbers.
  - 100% responsive: Fluid layout adapting between single-column mobile view and multi-column desktop grid.

---

## 2. Data Models & TypeScript Interfaces

```typescript
export interface VolunteerStudentForm {
  name: string;
  dob: string;
  age: number | '';
  belt: string;
  branch: string;
  phone: string;
  address: string;
  photo_url: string;
}

export interface StudentRecord {
  id: string; // Supabase row UUID / primary key
  member_id: string; // Permanent roll number (e.g. XMF2601)
  name: string;
  dob?: string;
  age?: number;
  phone?: string;
  email?: string;
  belt: string;
  branch: string;
  address?: string;
  photo_url?: string;
  role: 'student' | 'instructor' | 'volunteer' | 'admin';
  member_status: 'Active' | 'Inactive' | 'Discontinued';
  pattern_hash: string;
  date_of_joining: string;
  is_reviewed: boolean;
  is_deleted: boolean;
  created_at?: string;
}
```

---

## 3. Image Optimization Pipeline (`src/lib/image.ts`)

Smartphone cameras produce 5MB–15MB JPEGs, which degrade mobile performance, consume excessive volunteer bandwidth, and inflate storage usage.

### Implementation Details:
- **Function**: `compressImage(file: File, maxWidth = 800, quality = 0.8): Promise<Blob>`
- **Logic**:
  1. Read `File` into an HTML `Image` element via `URL.createObjectURL`.
  2. Calculate aspect-ratio-preserving dimensions where neither width nor height exceeds `maxWidth` (800px).
  3. Draw image onto an offscreen `<canvas>` context.
  4. Export canvas to `image/webp` (falling back to `image/jpeg` if WebP is unsupported).
  5. Resulting image size: typically **70KB – 150KB** with crystal-clear avatar quality.
- **Supabase Storage Upload**:
  - Target bucket: `member-photos`
  - Filename pattern: `${student_id}_${Date.now()}.webp`
  - Public URL obtained via `supabase.storage.from('member-photos').getPublicUrl(path)`
  - Resilient error handling: If the storage bucket is missing or network fails, member creation proceeds with a placeholder, informing the volunteer to upload the photo later.

---

## 4. Crockford Base32 Deterministic Roll Number Engine (`XMFYYZZ`)

### Format:
`XMF` + `YY` (2-digit year of joining) + `ZZ` (2-digit Douglas Crockford Base32 sequence).
- Alphabet: `0123456789ABCDEFGHJKMNPQRSTVWXYZ` (32 characters, excluding ambiguous `I, L, O, U`).
- Normalization & decoding aliases: `I` and `L` $\rightarrow$ `1`, `O` $\rightarrow$ `0`. Reject `U` (accidental profanity protection).
- Starting sequence: `01` (value 1).
- `00` (value 0): Reserved for Admin Custom / VIP manual assignment.
- Capacity: 1,024 slots per joining year (`01` through `ZZ`).
- Rare Spillover: If 1,024 entries in a single year are exhausted, sequentially spillovers to 3-digit Crockford Base32 starting at `100` (8 characters total, e.g. `XMF26100`).

### Lowest Unused Gap Algorithm (`src/lib/idGenerator.ts`):
Sequential allocation computes the **lowest unused gap** above `01`, ensuring:
1. If an Admin manually assigns a high VIP suffix (e.g. `XMF26ZZ`), standard registrations continue sequentially from `XMF2601` without jumping or triggering false spillovers.
2. Deleted IDs are permanently reserved in the database and never recycled.

### Golden Rules & Invariants:
1. **Admin-Only VIP / Custom Assignment**: Only users authenticated as `role === 'admin'` can assign custom Crockford suffixes (`00` to `ZZ`). Real-time debounced collision checking prevents duplicates.
2. **Admin-Only Review / Verification**: Only `role === 'admin'` can toggle member review verification (`is_reviewed`). Volunteers and instructors have read-only visibility.
3. **Never Recycle IDs**: Soft-deleted students retain their roll numbers permanently.
4. **Deterministic & Immutable**: Once minted and assigned to a member record, the roll number is permanently locked.

---

## 5. UI Structure & Components in `src/routes/xmform.tsx`

The page is organized into two primary tabs:
1. **Intake Tab ("New Student Entry")**
2. **Directory Tab ("All Students & Management")**

### Tab 1: New Student Intake Form
- **Form Controls & Validations**:
  - **Full Name**: Required, trimmed. Auto-capitalizes words.
  - **Date of Birth (`dob`)**: Native HTML date picker. When selected, automatically computes the exact age:
    ```typescript
    const calculateAge = (dobString: string): number => {
      const birth = new Date(dobString);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age;
    };
    ```
  - **Age**: Populated automatically upon selecting DOB, with manual override allowed.
  - **Belt**: Custom dropdown containing: White, Yellow, Orange, Green, Blue, Purple, Brown, Black (synced with club defaults or `app_settings`).
  - **Branch**: Custom dropdown containing branches (e.g. XMF Main HQ).
  - **Phone Number**: 10-digit number validation (`/^[6-9]\d{9}$/`).
    - Real-time duplicate check: Checks on blur against non-deleted members. If a duplicate exists, a non-blocking warning badge appears: *"Member already registered with this phone number"*.
  - **Address**: Textarea with 2 rows.
  - **Photo**:
    - Tap to take photo (camera on mobile/tablet) or upload file on PC.
    - Real-time thumbnail preview with removal button.
- **Batch Speed Entry Workflow**:
  - On submit:
    1. Generates `XMF2601` (or VIP suffix if assigned by Admin) ID.
    2. Compresses photo and uploads to Supabase Storage.
    3. Inserts into `members` table with:
       - `role: 'student'`
       - `pattern_hash: '048526'`
       - `member_status: 'Active'`
       - `is_reviewed: false`
       - `is_deleted: false`
    4. Shows instant Celebration Card displaying:
       - Large bold ID (`XMF2601`)
       - Student Name, Belt, and Branch
       - Direct Action: **"Register Another Student"** (resets form and auto-focuses Name input for maximum volunteer throughput).

---

### Tab 2: All Students Directory & CRUD
- **Search Bar**:
  - Real-time debounced search matching across:
    - `name` (case-insensitive)
    - `member_id`
    - `phone`
    - `branch`
    - `address`
- **Filter Row**:
  - **Belt**: Dropdown (All, White, Yellow, etc.).
  - **Branch**: Dropdown (All, XMF Main HQ, etc.).
  - **Review Status**: Dropdown (All, `Pending Review`, `Verified`).
  - **Status Filter**: Dropdown (`Active Only` - default, `Deleted Only`, `Show All`).
- **Pagination**:
  - Selectable page size: `10`, `25`, `50`.
  - Pagination stats: *"Showing 1–25 of 142 students"*.
  - Previous / Next buttons and direct page number indicator.
- **Volunteer Actions**:
  - **Edit Modal**:
    - Pre-populates selected student's data.
    - Allows updating Name, Age, DOB, Belt, Branch, Phone, Address, and Photo.
    - Submits update to Supabase with instant optimistic update in local state.
  - **Soft Delete**:
    - Calls `supabase.from('members').update({ is_deleted: true }).eq('member_id', id)`.
    - Record vanishes from active view immediately without running SQL `DELETE`.
    - Shows an instant Toast message with an **"Undo"** action to restore if clicked accidentally.

---

## 6. Detailed Step-by-Step Implementation Phases

### Phase 1: Utilities & Helpers
1. Create `src/lib/image.ts`:
   - Implement `compressImage(file, maxWidth, quality)` using offscreen canvas.
   - Return clean WebP/JPEG blob.

### Phase 2: Navigation & Route Setup
2. Modify `src/components/Header.tsx`:
   - Add `/xmform` link in desktop header navigation.
   - Add `/xmform` link in mobile slide-over drawer menu.
3. Create `src/routes/xmform.tsx`:
   - Declare route `createFileRoute('/xmform')`.
   - Setup layout skeleton, tab switcher (Intake Form vs. Directory), and shared state.

### Phase 3: Intake Form & Storage Integration
4. Implement student ID generator (`generateNextStudentId`) in `src/routes/xmform.tsx`.
5. Implement Intake Form:
   - Full Name, DOB, Age auto-calc, Belt select, Branch select, Phone with duplicate check, Address, Camera/File photo input.
   - Photo upload to `member-photos` bucket using `src/lib/image.ts`.
   - Supabase `insert` call into `members` table.
   - Success confirmation card with rapid reset for next entry.

### Phase 4: Directory, Search, Filters, Pagination & CRUD
6. Implement Student Directory:
   - Supabase fetch query with real-time refresh.
   - Client-side search across Name, ID, Phone, Branch, Address.
   - Belt, Branch, Review Status, and Deleted Status filters.
   - Pagination calculation & controls.
   - Mobile card rendering and desktop table rendering.
7. Implement Volunteer Edit Modal:
   - Edit form pre-filling existing values and updating Supabase row.
8. Implement Soft-Delete & Undo action:
   - Update `is_deleted: true` / `is_deleted: false`.

### Phase 5: Verification & Quality Assurance
9. Run `npx tsc -b` to guarantee zero TypeScript errors.
10. Run `npm run build` to verify production bundle integrity.
11. Test responsiveness across mobile, tablet, and desktop breakpoints.
