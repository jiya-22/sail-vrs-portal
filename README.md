# SAIL VRS Portal

A full-stack web application developed for **Steel Authority of India Limited (SAIL), Centre for Engineering and Technology (CET), Ranchi** to digitize the **Voluntary Retirement Scheme (VRS)** process.

The portal automates eligibility verification, ACP (Average Credit Point) verification for executive employees, compensation computation, application submission, first-come-first-served (FCFS) processing and administrative decision-making.

---

## Features

### Employee Module
- Secure login with Employee ID + password (JWT)
- Profile and service details (DOB, DOJ, age, completed service, months left to superannuation at 60)
- Automatic **eligibility evaluation** (age ≥ 50, service ≥ 15 years, not superannuated)
- **ACP verification** for executives — ACP ≤ 42.5 (50–54 yrs), ACP ≤ 45 (54–57 yrs), unrestricted (57+)
- **Compensation estimate** — Daily Salary = (Basic + DA) / 26; Formula A; Formula B; payout = 75% × lower of the two
- Step-by-step **compensation breakdown** page
- **Apply for VRS** with server-side re-validation and duplicate-pending prevention (HTTP 409)
- **Application Status** tracking (Pending / Approved / Rejected) with a progress timeline

### Admin Module
- Admin-only application queue ordered **FCFS** by submission timestamp
- Application review screen (employee details + compensation figures)
- **Approve / Reject** with recorded decision, timestamp, decider and rejection reason
- **Register Employee** — create employee accounts incl. executive grading history (used for ACP)
- Dashboard statistics (total / pending / approved / rejected / approved compensation outflow)

### Security
- JWT authentication, bcrypt password hashing
- Role-based access control (Employee / Admin), enforced server-side
- Protected API routes; CORS restricted to configured frontend origins

---

## Technology Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 19, TypeScript, React Router, Axios, Vite |
| Backend   | Node.js, Express.js |
| Database  | MySQL 8.0 (mysql2, promise pool) |
| Auth      | JWT (jsonwebtoken), bcryptjs |

Three-tier client-server architecture: React SPA → Express REST API (`/api/*`, JSON) → MySQL.

---

## Project Structure

```
sail_vrs_folder/
├── backend/
│   ├── src/
│   │   ├── config/db.js            # mysql2 promise pool
│   │   ├── middleware/auth.js      # JWT authenticate + role authorize
│   │   ├── controllers/            # auth, employee, application
│   │   ├── routes/                 # /api/auth, /api/employees, /api/applications
│   │   ├── services/profileService.js  # profile + eligibility + ACP + compensation payload
│   │   ├── utils/                  # vrsFormula.js, eligibility.js
│   │   └── server.js
│   ├── scripts/setup-db.js         # schema + legacy migration + demo seed
│   ├── api.http                    # REST Client test requests
│   └── .env.example
└── frontend/
    └── src/
        ├── components/             # Navbar, ProtectedRoute, StatusBadge, Footer
        ├── context/AuthContext.tsx
        ├── hooks/useEmployeeProfile.ts
        ├── pages/                  # Home, Login, Dashboard, Apply, Compensation,
        │                           # Status, Admin (queue), AdminApplicationDetail, AdminRegister
        ├── services/api.ts         # Axios instance (attaches JWT, handles 401)
        └── index.css               # SAIL design system (navy + saffron, Georgia serif)
```

---

## Database Schema

Normalized MySQL 8.0 database `sail_vrs` with three core tables:

- **employees** — `employee_id` (PK), name, department, designation, `designation_type` (`executive`/`non_executive`), `date_of_birth`, `date_of_joining`, `basic_pay`, `da`, `role` (`employee`/`admin`), `password_hash`
- **grading_history** — `id` (PK), `employee_id` (FK), `year`, `grade`, `credit_points` — yearly executive appraisals used for ACP
- **vrs_applications** — `application_id` (PK), `employee_id` (FK), `formula_a`, `formula_b`, `final_compensation`, `status` (`Pending`/`Approved`/`Rejected`), `submitted_at` (FCFS ordering), `decided_at`, `decided_by`, `rejection_reason`

Legacy tables (`employees`, `users`, `vrs_applications`, `calculations`, `vrs_calculations`) were backed up to `*_backup_legacy` during migration — nothing was dropped.

---

## Getting Started

### Prerequisites
- Node.js 20+
- MySQL 8.0 running locally (service `MySQL80`)

### 1. Database setup
```bash
cd backend
npm install
# edit .env — set DB_PASSWORD etc. (see .env.example)
npm run setup-db
```
This creates the schema, migrates legacy data, and seeds demo accounts.

### 2. Backend
```bash
npm run start     # production mode
npm run dev       # nodemon (auto-restart)
```
API runs on **port 5001** (port 5000 is occupied by another local project on the development machine; set `PORT=5000` in `.env` if it is free for you).

Health check: `GET http://localhost:5001/api/health`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev       # Vite dev server on http://localhost:5173
npm run build     # type-check + production build
```
Set `VITE_API_URL` in `frontend/.env` (defaults to `http://localhost:5001/api`).

---

## Demo Credentials

| Employee ID | Password   | Role     | Notes |
|-------------|------------|----------|-------|
| `ADMIN001`  | `Admin@123` | admin    | HR Administrator |
| `EMP001`    | `Emp@123`   | employee | Non-executive; has an approved legacy application |
| `EMP002`    | `Emp@123`   | employee | Executive, ACP 43.2 (within limit for age 55) |
| `EMP003`    | `Emp@123`   | employee | Executive, ACP 47.4 — **not** eligible (ACP too high) |
| `SAIL101`   | `Sail@123`  | employee | Executive (migrated legacy record) |
| `SAIL102`   | `Sail@123`  | employee | Executive (migrated legacy record) |
| `SAIL103`   | `Sail@123`  | employee | Non-executive (migrated legacy record) |

### Suggested demo flow
1. Sign in as `EMP002` → dashboard (eligible badge, ACP table) → **Compensation** (5-step breakdown) → **Apply for VRS** → **Application Status** (Pending).
2. Sign out, sign in as `ADMIN001` → **Application Queue** (FCFS order) → open the application → **Approve** (or Reject with a reason).
3. Sign in as `EMP002` again → **Application Status** now shows the decision.
4. Sign in as `EMP003` → dashboard shows **Not Eligible** (ACP exceeds the limit); Apply is blocked.

---

## API Overview

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/api/auth/login` | public | Login, returns JWT + role |
| GET  | `/api/auth/me` | authenticated | Current token identity |
| POST | `/api/employees` | admin | Register employee (+ grading history) |
| GET  | `/api/employees` | admin | List employees |
| GET  | `/api/employees/:id` | owner/admin | Profile + live eligibility/ACP/compensation |
| GET  | `/api/employees/:id/grading-history` | owner/admin | Grading history |
| POST | `/api/applications` | employee | Submit VRS application (409 if pending exists) |
| GET  | `/api/applications` | authenticated | FCFS queue (admin) / own applications (employee) |
| GET  | `/api/applications/:id` | owner/admin | Application detail |
| PATCH | `/api/applications/:id/status` | admin | Approve / Reject |
| GET  | `/api/health` | public | API + database connectivity |

See `backend/api.http` for ready-to-use REST Client requests covering the documented test scenarios (401/403/400/409 paths).

---

## Business Rules

- **Eligibility**: age ≥ 50; ≥ 15 completed years of service; not yet superannuated (age 60).
- **ACP (executives only)**: age 50–54 → ACP ≤ 42.5; age 54–57 → ACP ≤ 45; age 57+ → no restriction. ACP = average of `credit_points` in `grading_history`.
- **Daily Salary** = (Basic Pay + DA) / 26
- **Formula A** = 35 × DS × Completed Years + 25 × DS × Remaining Years (remaining years = months left to age 60 ÷ 12)
- **Formula B** = 30 × DS × Months Left Before Superannuation
- **Final Compensation** = 75% × MIN(Formula A, Formula B)
- **FCFS**: applications are ordered by `submitted_at`; duplicate *pending* applications are rejected with HTTP 409.

---

## Notes

- `backend/.env` contains local development credentials and is git-ignored; use `.env.example` as the template.
- Frontend `.env` holds `VITE_API_URL`; it is also git-ignored.
- The compensation shown to employees is an **estimate**; sanctioned amounts are subject to administrative verification.
