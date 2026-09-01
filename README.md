# Software Defect Re-Test Execution Logger

A clean, robust, and functional web application built from scratch for a college **Software Engineering / Quality Assurance (SE/QA)** project. It manages the complete defect lifecycle: bug reporting, developer fix submissions, QA re-test execution with attempt tracking, and QA Lead final closure sign-offs.

---

## 🎓 2-Minute College Viva Pitch

> *"The **Software Defect Re-Test Execution Logger** is a QA management platform built with React, Express, and SQLite. When a bug is discovered, a **QA Tester** reports the defect and assigns it to a real **Developer**. The Developer diagnoses the root cause, applies a patch, and submits the build version for re-testing, moving the status to `READY_FOR_RETEST`. The QA Tester then verifies the fix in a dedicated Re-Test Queue and records either **PASS** or **FAIL** with sequential attempt numbers (`Attempt #1`, `Attempt #2`, ...). If the re-test fails, the defect is reopened and sent back to the developer. If the re-test passes, it enters `PENDING_CLOSURE`. Finally, the **QA Lead** reviews the successful test evidence and approves official closure (`CLOSED`). All data, fix histories, re-test attempts, and audit logs are persistently stored in SQLite."*

---

## 🚀 Key Features

- **Strict 3-Role Authorization**: QA Tester, Developer, and QA Lead workspaces with dedicated sidebars, route guards, and backend permission validation.
- **Developer Workload Isolation**: Developers only see defects specifically assigned to their account. Cross-developer access is blocked at both API and UI levels.
- **Sequential Attempt Tracking**: Automatically calculates and persists `Attempt #1`, `Attempt #2`, `Attempt #3`, etc., for every re-test cycle.
- **Audit History Logging**: Every state transition (creation, fix submission, PASS/FAIL re-test, closure approval) creates an immutable timestamped audit log.
- **Live SQLite-Driven Dashboards**: Real-time metrics for Total Defects, Open, Ready for Re-Test, Reopened, Pending Closure, and Closed.
- **Instant Search & Status Filtering**: Real-time filtering by Defect ID, Title, Module, or Status.
- **100% Persistent Local Database**: Uses native SQLite (`database.sqlite`). Data survives page refreshes, logouts, and server restarts without dropping tables.
- **One-Click Demo Account Switching**: Built-in login chips to instantly populate demo credentials during viva presentations.

---

## 👥 User Roles & Permission Matrix

| Action / Permission | QA Tester | Developer | QA Lead |
| :--- | :---: | :---: | :---: |
| **Log in & View Role Dashboard** | ✅ | ✅ | ✅ |
| **Create New Defect (`BUG-XXXX`)** | ✅ | ❌ | ❌ |
| **View All Defects Directory** | ✅ | ❌ (Assigned only) | ✅ |
| **View Assigned Defects Only** | ❌ | ✅ | ❌ |
| **Submit Fix (Root Cause & Build Version)** | ❌ | ✅ | ❌ |
| **Execute Re-Test (PASS / FAIL)** | ✅ | ❌ | ❌ |
| **Approve Final Closure (`CLOSED`)** | ❌ | ❌ | ✅ |
| **View Audit Trail & Fix/Test History** | ✅ | ✅ (Assigned only) | ✅ |

---

## 🔄 Defect Lifecycle State Machine

```
              [ QA Tester Logs Defect ]
                          │
                          ▼
                       ┌──────┐
                       │ OPEN │
                       └──────┘
                          │
              [ Developer Submits Fix ]
                          │
                          ▼
               ┌───────────────────┐
               │ READY_FOR_RETEST  │
               └───────────────────┘
                          │
             [ QA Tester Re-Tests Defect ]
                    ┌─────┴─────┐
            ( FAIL )            ( PASS )
               │                   │
               ▼                   ▼
         ┌──────────┐    ┌─────────────────┐
         │ REOPENED │    │ PENDING_CLOSURE │
         └──────────┘    └─────────────────┘
               │                   │
  [ Dev Submits Fix #2 ]  [ QA Lead Sign-Off ]
               │                   │
               └─────────► ┌──────────────┐
                           │    CLOSED    │
                           └──────────────┘
```

### Defect Statuses
1. `OPEN` — Newly logged defect awaiting developer action.
2. `IN_PROGRESS` — Developer is actively investigating or debugging.
3. `READY_FOR_RETEST` — Developer submitted a code fix with build version.
4. `REOPENED` — QA Tester re-tested the fix and marked it `FAIL`.
5. `PENDING_CLOSURE` — QA Tester verified the fix and marked it `PASS`.
6. `CLOSED` — QA Lead verified test evidence and granted closure approval.

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 18
  - Vite (Fast development server and production build)
  - React Router DOM v6 (Role-based protected routing)
  - Lucide React (Clean icon set)
  - Vanilla CSS (Modern light-mode dashboard styling)
- **Backend**:
  - Node.js
  - Express.js
  - JSON Web Tokens (JWT) for session authentication
  - CORS middleware
- **Database**:
  - SQLite (Native `node:sqlite` / SQLite file `backend/database/database.sqlite`)

---

## 🗄️ Database Schema

### 1. `users`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER PRIMARY KEY | Auto-incrementing User ID |
| `name` | TEXT NOT NULL | Full user name |
| `email` | TEXT UNIQUE NOT NULL | Login email address |
| `password` | TEXT NOT NULL | User password |
| `role` | TEXT NOT NULL | `QA_TESTER`, `DEVELOPER`, or `QA_LEAD` |

### 2. `defects`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER PRIMARY KEY | Internal ID |
| `defect_code` | TEXT UNIQUE NOT NULL | Formatted ID (`BUG-1001`, `BUG-1002`) |
| `title` | TEXT NOT NULL | Defect title |
| `description` | TEXT NOT NULL | Detailed issue summary |
| `severity` | TEXT NOT NULL | `Low`, `Medium`, `High`, `Critical` |
| `priority` | TEXT NOT NULL | `P1`, `P2`, `P3`, `P4` |
| `module` | TEXT NOT NULL | Affected module/subsystem |
| `steps_to_reproduce`| TEXT NOT NULL | Step-by-step reproduction guide |
| `expected_result` | TEXT NOT NULL | Expected software behavior |
| `actual_result` | TEXT NOT NULL | Actual software failure |
| `assigned_developer`| INTEGER (FK users.id)| Assigned developer account |
| `status` | TEXT NOT NULL | `OPEN`, `READY_FOR_RETEST`, `REOPENED`, etc. |
| `created_by` | INTEGER (FK users.id)| QA tester who reported the bug |
| `created_at` | DATETIME | Timestamp |

### 3. `fixes`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER PRIMARY KEY | Fix record ID |
| `defect_id` | INTEGER (FK defects.id)| Defect being fixed |
| `developer_id`| INTEGER (FK users.id)| Submitting developer |
| `root_cause` | TEXT NOT NULL | Explanation of root cause |
| `fix_description` | TEXT NOT NULL | Technical details of applied patch |
| `build_version` | TEXT NOT NULL | Software release version (e.g. `1.0.1`) |
| `created_at` | DATETIME | Timestamp |

### 4. `retests`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER PRIMARY KEY | Re-test ID |
| `defect_id` | INTEGER (FK defects.id)| Defect being verified |
| `tester_id` | INTEGER (FK users.id)| QA Tester who ran the verification |
| `attempt_number` | INTEGER NOT NULL | Sequential number (`1`, `2`, `3`, ...) |
| `result` | TEXT NOT NULL | `PASS` or `FAIL` |
| `environment`| TEXT | Test environment (e.g. `Staging Build v1.0.1`) |
| `comments` | TEXT NOT NULL | Tester findings and verification notes |
| `created_at` | DATETIME | Timestamp |

### 5. `audit_logs`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER PRIMARY KEY | Log entry ID |
| `defect_id` | INTEGER (FK defects.id)| Referenced defect |
| `user_id` | INTEGER (FK users.id)| User triggering the action |
| `action` | TEXT NOT NULL | Event code (`DEFECT_CREATED`, `FIX_SUBMITTED`, etc.) |
| `description`| TEXT NOT NULL | Human-readable log message |
| `created_at` | DATETIME | Timestamp |

---

## 🔑 Demo Login Credentials

The following demo accounts are automatically initialized in SQLite:

| Role | Email | Password | Permissions / Notes |
| :--- | :--- | :--- | :--- |
| **QA Tester** | `qa@test.com` | `123456` | Log defects, view all defects, execute re-tests |
| **Developer 1** | `developer@test.com` | `123456` | View assigned defects, submit code fixes |
| **Developer 2** | `developer2@test.com` | `123456` | Additional developer for testing isolation |
| **QA Lead** | `lead@test.com` | `123456` | View all defects, approve final closure |

---

## 💻 Installation & How to Run Locally

### Prerequisites
- Node.js (v18 or higher installed on your system)

### Step 1: Install Backend & Initialize Database
```bash
cd backend
npm install
node database/init.js
```

### Step 2: Install Frontend
```bash
cd ../frontend
npm install
```

### Step 3: Start Backend and Frontend
In terminal 1 (Backend):
```bash
cd backend
node server.js
```
*(Runs API on `http://localhost:5000`)*

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
*(Runs Web UI on `http://localhost:3000`)*

Open your browser and visit: **`http://localhost:3000`**

---

## 🧪 Step-by-Step Testing Workflow (College Demo)

To demonstrate the full lifecycle during a presentation or viva:

1. **Sign in as QA Tester (`qa@test.com` / `123456`)**:
   - Go to **Create Defect**.
   - Title: `Login Button Not Responding`, Severity: `High`, Priority: `P1`, Assign to: `Alex Rivera (Developer 1)`.
   - Submit. Defect code `BUG-1001` (or next sequence) is generated with status `OPEN`.
2. **Sign in as Developer 1 (`developer@test.com` / `123456`)**:
   - Go to **Assigned Defects**. See `BUG-1001` listed.
   - Click **Submit Fix**. Enter Root Cause: `Disabled button state handling`, Build: `1.0.1`, Fix Description: `Corrected state listener`.
   - Submit. Status becomes `READY_FOR_RETEST`.
3. **Sign in as QA Tester (`qa@test.com` / `123456`)**:
   - Go to **Re-Test Queue**. See `BUG-1001`.
   - Click **Start Re-Test**. Select `FAIL`, enter comments: `Issue still reproducible on Safari`.
   - Submit. Status becomes `REOPENED` (Attempt #1 recorded).
4. **Sign in as Developer 1 (`developer@test.com` / `123456`)**:
   - In **Assigned Defects**, see `BUG-1001` is reopened.
   - Click **Submit Fix**. Enter Build: `1.0.2`, Root Cause: `Cross-browser event propagation`, Fix: `Universal pointer event handler`.
   - Submit. Status becomes `READY_FOR_RETEST`.
5. **Sign in as QA Tester (`qa@test.com` / `123456`)**:
   - In **Re-Test Queue**, execute Attempt #2 with `PASS`, comments: `Verified and resolved on all browsers`.
   - Submit. Status becomes `PENDING_CLOSURE` (Attempt #2 recorded).
6. **Sign in as QA Lead (`lead@test.com` / `123456`)**:
   - Go to **Closure Approval**. See `BUG-1001` with `PASS` re-test evidence and tester notes.
   - Click **Approve Closure**. Status becomes `CLOSED`.
7. **Inspect Defect Details**:
   - Open defect details to see the complete history: 2 Fixes, 2 Re-Test attempts, and all Audit logs.

### Running Automated Test Suite
You can also run the full automated verification suite anytime:
```bash
cd backend
node test-e2e-all.js
```

---

## 🔮 Future Scope
- Exporting defect re-test execution summaries to PDF / Excel.
- Real-time WebSocket notifications when a developer submits a fix.
- Attachment support for defect screenshots and screen recordings.
- Defect SLA and turnaround time analytics.

---

## 👨‍💻 Project Information
- **Course**: Software Engineering & Quality Assurance (SE/QA)
- **Topic**: Software Defect Re-Test Execution Logger
- **Architecture**: Client-Server (REST API + SPA + SQLite)
