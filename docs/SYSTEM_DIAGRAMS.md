# XMFCLUB: System Architecture Diagrams

This document contains detailed Mermaid UML and Flowchart diagrams defining the pure technical architecture of the XMFCLUB platform. These diagrams are intended to align developers on design choices, specifically concerning RBAC, state machines, and concurrency handling.

## 1. Authentication & RBAC Flow (The Decoupled Model)

**Purpose:** Demonstrates how TanStack (Better Auth) and FastAPI (JWT) handle stateless authorization, ensuring the backend can rapidly verify permissions without a database bottleneck.

```mermaid
sequenceDiagram
    participant C as Client (Browser)
    participant BA as Better Auth (TanStack API)
    participant DB as PostgreSQL DB
    participant FA as FastAPI (Backend)

    %% Authentication Phase
    C->>BA: POST /api/auth/sign-in (Credentials)
    BA->>DB: Query User & Validate Hash
    DB-->>BA: Valid User Record
    BA-->>C: Set HTTP-only Session Cookie + JWT Payload (User ID, Role)

    %% Authorized Request Phase
    Note over C,FA: Client navigates to protected A la Carte builder
    C->>FA: GET /api/v1/modules (Authorization: Bearer <JWT>)
    FA->>FA: Decode JWT (Shared Secret)
    FA->>FA: Extract `sub` (User ID) and `role`
    
    alt Role == 'admin'
        FA-->>C: 200 OK (Full Access, write permissions)
    else Role == 'student'
        FA-->>C: 200 OK (Read-only access to modules)
    else Invalid Signature / Expired
        FA-->>C: 401 Unauthorized
    end
```

---

## 2. Admin Genesis & Platform Provisioning

**Purpose:** Outlines the sequence required to bootstrap the platform from an empty state to a fully operational A la Carte builder.

```mermaid
flowchart TD
    Start([System Genesis]) --> CreateSuperAdmin[1. Seed Super Admin]
    CreateSuperAdmin --> AdminLogin[2. Admin Logs In via Better Auth]
    
    AdminLogin --> ModuleCreation[3. POST /api/v1/modules]
    ModuleCreation --> DefinePricing[Set Price, Category, Duration]
    
    ModuleCreation --> InventoryCreation[4. POST /api/v1/inventory]
    InventoryCreation --> AssignTrainer[Assign Trainer UUID]
    InventoryCreation --> DefineSlot[Set Day, Start/End Time]
    InventoryCreation --> SetCapacity[Set Max Capacity (e.g., 15)]
    
    SetCapacity --> PlatformReady([Platform Ready for Students])
```

---

## 3. A la Carte Builder & Inventory Engine (Supply vs Demand)

**Purpose:** Explains how the system generates bookable slots from templates and handles flexible date selection.

```mermaid
flowchart TD
    Admin([Admin Portal]) --> CreateTemplate[1. Define SlotTemplate e.g. Mon 10AM]
    CreateTemplate --> Publish[2. Publish for Month]
    Publish --> GenerateInstances[3. Generate SlotInstances for specific dates]
    
    Student([Student Builder]) --> ViewCalendar[4. Fetch SlotInstances]
    ViewCalendar --> SelectDates[5. Select Specific Dates/Slots]
    SelectDates --> Validate[6. Check Instance Capacity]
    Validate --> Payment[7. Trigger Payment Orchestrator]
```

---

## 4. Multi-Gateway Payment Orchestrator

**Purpose:** Shows the strategy pattern in action for handling multiple payment providers.

```mermaid
sequenceDiagram
    participant C as Client
    participant PO as Payment Orchestrator
    participant RZ as Razorpay Provider
    participant PP as PhonePe Provider
    participant CF as Cashfree Provider

    C->>PO: create_order(provider="phonepe", amount)
    PO->>PO: Resolve Provider Strategy
    
    alt Provider == "phonepe"
        PO->>PP: create_order()
        PP-->>PO: Order ID / Token
    else Provider == "razorpay"
        PO->>RZ: create_order()
        RZ-->>PO: Order ID
    end
    
    PO-->>C: Unified Order Metadata
```

---

## 4. Payment Webhook & Subscription State Machine

**Purpose:** Details the asynchronous workflow when Razorpay successfully captures a payment, updating both the financial invoice and the student's active curriculum.

```mermaid
stateDiagram-v2
    [*] --> PENDING_INVOICE: create_multi_order()
    
    state PENDING_INVOICE {
        [*] --> AwaitingRazorpay
        AwaitingRazorpay --> WebhookReceived: payment.captured event
    }
    
    PENDING_INVOICE --> PAID: FastAPI verifies signature
    PENDING_INVOICE --> FAILED: Webhook reports payment.failed
    
    state PAID {
        UpdateInvoice: Update Invoice (paid_at, razorpay_payment_id)
        CreateSubscription: Create Active Subscription (Module + Slot)
        IncrementEnrollment: current_enrollment += 1 (Inventory)
        
        UpdateInvoice --> CreateSubscription
        CreateSubscription --> IncrementEnrollment
    }
    
    PAID --> [*]: Student Microsite Updated
    FAILED --> [*]: UI Prompts Retry
```

---

## 5. The Halal Freeze Policy Flow

**Purpose:** The business logic for pausing a subscription fairly without predatory billing.

```mermaid
flowchart TD
    Start([Admin Clicks Freeze]) --> FetchSub[Fetch Active Subscription]
    
    FetchSub --> CheckDays{Remaining Days > 0?}
    
    CheckDays -- No --> Error([400 Error: Expired])
    CheckDays -- Yes --> FreezeLogic[Calculate Remaining Days]
    
    FreezeLogic --> UpdateDB[Update DB: is_frozen = True]
    UpdateDB --> SaveCredits[Store freeze_credit_days = next_billing - today]
    SaveCredits --> FrozenState([Subscription Frozen])
    
    %% Unfreeze
    FrozenState --> AdminUnfreeze([Admin Clicks Unfreeze])
    AdminUnfreeze --> RestoreSub[Update DB: is_frozen = False]
    RestoreSub --> SetNewDate[next_billing_date = today + freeze_credit_days]
    SetNewDate --> ActiveState([Subscription Active])
```

---

## 6. Offline Payment Single-Source-Of-Truth

**Purpose:** How cash or direct UPI transfers are logged without breaking the digital ecosystem.

```mermaid
sequenceDiagram
    participant T as Trainer/Admin
    participant API as FastAPI Offline Endpoint
    participant DB as PostgreSQL
    participant S as Student Microsite

    T->>API: POST /offline-payment (user_id, module_id, amount)
    API->>DB: Insert Invoice (status="PAID_OFFLINE")
    API->>DB: Insert Subscription (start_date, next_billing)
    API->>DB: Increment Inventory current_enrollment
    DB-->>API: Commit Success
    API-->>T: 200 OK
    
    Note over S: Student scans RFID card
    S->>DB: GET /users/rfid/{uuid}
    DB-->>S: Returns Updated Active Profile & Fee Status
```
