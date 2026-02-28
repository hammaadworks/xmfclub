# System Setup & Genesis Protocol: xmfclub

This document outlines the steps required to bootstrap the xmfclub platform from a completely blank database into a fully operational system.

---

## 1. The Genesis Protocol (Seeding the First Admin)

Because the system uses a decoupled architecture (Better Auth for identity, FastAPI for RBAC/Business Logic), you cannot simply run a raw SQL script to create an Admin. The backend must securely link a Better Auth session to a PostgreSQL `User` record.

To solve this, we built the **Genesis Protocol**.

### Steps to Seed the Super Admin:
1. **Start the Stack:** Ensure both the frontend (TanStack) and backend (FastAPI) servers are running.
2. **Navigate to the Genesis UI:** In your browser, go to `http://localhost:3000/admin/setup` (or your respective frontend URL).
3. **Authenticate:** You will be prompted to sign in. Create a new account using the standard sign-up flow. This creates your identity in Better Auth.
4. **The Override:** Once logged in, you will be redirected back to the Genesis Protocol dashboard.
5. **Provide Credentials:**
   - **System Secret:** Enter the `SECRET_KEY` exactly as it appears in your backend `.env` file.
   - **Master RFID UUID:** Scan or manually type the UUID of the physical NFC card you want to act as your Master Key (e.g., `550e8400-e29b-41d4-a716-446655440000`).
6. **Execute:** Click "Execute Override".
   - The system will auto-provision your database record, elevate your `role` to `admin`, and permanently link your `rfid_uuid`.
   - You will be redirected to the secure Admin Dashboard.

*(Note: Once the Super Admin is seeded, this endpoint can be disabled in production or strictly monitored.)*

---

## 2. Platform Provisioning (The Next Steps)

Once you are the Super Admin, the platform is still empty. To make the "A la Carte" builder functional for new students, you must provision the following in the Admin Dashboard:

### Step 2.1: Create Curriculum Modules
Navigate to **Admin -> Curriculum** and create the core modules.
- **Example:** Name: `Advanced Sparring`, Category: `martial-arts`, Price: `2500`, Duration: `4 weeks`.

### Step 2.2: Define Inventory (Time Slots)
Navigate to **Admin -> Schedule** and attach physical time slots to the modules you just created.
- **Example:** Module: `Advanced Sparring`, Day: `Monday`, Time: `18:00 - 19:00`, Max Capacity: `15`.

Once the Modules and Inventory are defined, the public-facing `/training/curriculum` page will automatically populate, and students can begin enrolling and paying via Razorpay.
