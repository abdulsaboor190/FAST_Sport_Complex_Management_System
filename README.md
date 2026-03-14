# FSCM – FAST Sports Complex Management System

Phase 1: Foundation & Core Authentication · **Phase 2: Facility Reservation System** · Phase 3–6 (Coaching, Events, Equipment, Analytics) · **Phase 7: Issue Tracking & Maintenance**

## Tech stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion, Redux Toolkit + RTK Query, React Hook Form + Zod, shadcn-style UI (Radix), Lucide React, react-hot-toast, date-fns, Socket.io client
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT (access + refresh), bcrypt, HTTP-only cookies, Socket.io, date-fns
- **Auth:** FAST ID validation (e.g. `23I-0545`), roles: Student, Faculty, Coach, Admin

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or pnpm

## Setup

### 1. Environment

```bash
# Root
npm install

# Backend
cd server
cp .env.example .env
# Edit .env: set DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET (min 32 chars), CLIENT_URL
npm install
npm run db:generate
npm run db:push
npm run db:seed    # Seed facilities (Badminton, Football, Basketball, etc.)
```

### 2. Run

From project root:

```bash
npm run dev
```

- API: http://localhost:4000  
- Client: http://localhost:5173 (proxies /api, /uploads, /socket.io to backend)

Or run separately:

```bash
npm run dev:server   # backend
npm run dev:client   # frontend
```

## Phase 1 deliverables

- [x] User registration with FAST ID validation (23I-XXXX)
- [x] Login / logout with JWT refresh tokens (HTTP-only cookies)
- [x] Role-based access (Student, Faculty, Coach, Admin)
- [x] Password reset via email (SMTP config in .env)
- [x] User profile and avatar upload
- [x] Responsive dashboard layout (glassmorphism sidebar)
- [x] Landing page with hero and feature section
- [x] Protected routes and session restore on refresh
- [x] Toast notifications and loading skeletons

## Phase 2 deliverables (Facility Reservation)

- [x] **Facility selection:** Interactive facility cards (Badminton, Football, Basketball, Table Tennis, Pool), detail modal, real-time “slots remaining today” badge
- [x] **Time-slot booking:** Day view with prev/next, color-coded slots (Available / Booked / Your booking), click-to-book, duration selector (min–max slots), peak/off-peak pricing
- [x] **Real-time availability:** Socket.io subscribe per facility+date; live slot updates when others book or cancel
- [x] **Conflict detection:** Server-side validation on create; 409 with conflict info; client refetch and toast on conflict
- [x] **Booking form:** Facility, date/time, duration, purpose, participants, special requirements, pricing display
- [x] **Cancellation & refund:** 24h notice; full refund >48h, 50% 24–48h, no refund <24h; cancellation with optional reason; refund status; email notification (when SMTP configured)
- [x] **My Bookings:** Upcoming/past filters, status badges, countdown, cancel button, re-book link, cancellation policy and refund badge
- [x] **Admin:** GET /api/bookings/admin/all, PATCH /api/bookings/admin/:id/refund-status for refund workflow

## Project structure

```
FSCM/
├── client/          # React app (Vite)
├── server/          # Express API, Prisma
│   ├── prisma/
│   └── src/
│       ├── routes/
│       ├── middleware/
│       └── lib/
├── package.json     # Root scripts (concurrently)
└── README.md
```

## Database

PostgreSQL connection string in `server/.env`:

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/fscm?schema=public"
```

Create DB if needed: `createdb fscm`

## Password reset (dev)

Without SMTP, the server logs the reset link to the console when you request a reset.

## Phase 7 – Issue Tracking & Maintenance

- **Issue reporting (users):**
  - Report issues against facilities, equipment, bookings or safety with category, priority, location and description.
  - Attach multiple photos/videos via drag-and-drop upload.
  - View a “My issues” dashboard with status badges (Open, In Progress, Resolved, Closed) and basic details.
- **Admin issue management:**
  - `/api/issues` secured for Admins with filters for status/category/priority and search.
  - Full issue detail includes reporter/assignee, timeline activities and comments (with internal notes).
  - Status/priority/assignee updates emit Socket.io events for real-time UI refresh.
- **Workflow & maintenance:**
  - Status workflow `Open → Acknowledged → InProgress → Resolved → Closed` tracked as `IssueActivity` records.
  - Issues link to `Facility`, `EquipmentItem` or `Booking` for context and maintenance follow-up.
  - Attachments are stored under `server/uploads/issues` and served via `/uploads/issues/*`.

### How to use (dev)

- Backend
  - Ensure `server/.env` has `CLIENT_URL` pointing to the React app and `ADMIN_REPORT_EMAILS` for report emails (optional).
  - Run `npm run db:generate` and `npm run db:push` in `server` so the new `Issue*` models are applied.
- Frontend
  - Log in, open the sidebar and navigate to **Issues** → **Report new issue**.
  - After submitting, you can see your tickets under **Issues** and Admins can manage them via `/api/issues` and future admin UI screens.
