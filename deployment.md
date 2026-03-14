# 🚀 FSCM Deployment Guide

This document provides a comprehensive walkthrough for deploying the **FAST Sports Complex Management (FSCM)** system.

## 🏗️ Technical Architecture
- **Frontend**: React (Vite) + Tailwind CSS + Framer Motion
- **Backend**: Node.js (Express) + Socket.io
- **Database**: PostgreSQL (Prisma ORM)
- **Deployment Strategy**: Backend serves the built Frontend (Monolith approach)

---

## 1. Environment Configuration

You must set up environment variables for both sectors. Copy the `.env.example` files to `.env` in their respective directories.

### 🔐 Backend (`server/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://user:pass@localhost:5432/fscm` |
| `JWT_ACCESS_SECRET` | 32+ char random string | `e.g. openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | 32+ char random string | `e.g. openssl rand -base64 32` |
| `CLIENT_URL` | Frontend URL (CORS) | `http://localhost:5173` (Dev) or Production URL |
| `PORT` | API Port | `4000` |
| `UPLOAD_DIR` | Media storage path | `./uploads` |
| `SMTP_HOST` | Email server host | `smtp.gmail.com` |

### 🌐 Frontend (`client/.env`)
| Variable | Description | Recommended |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | API Endpoint | Leave empty (uses relative `/api`) |
| `VITE_SOCKET_URL` | Socket Endpoint | Leave empty (uses relative) |

---

## 2. Database Synchronization

Ensure your PostgreSQL instance is running, then execute the following from the **root** directory:

```bash
# Generate Prisma Client
npm run db:generate

# Push Schema to Database
npm run db:push

# Seed Mandatory Data (Facilities, Admin, FAST Open)
npm run db:seed
```

---

## 3. Production Build

To deploy as a single unit, you must compile the frontend and integrate it into the backend's distribution folder.

### Step A: Build Frontend
```bash
cd client
npm install
npm run build
```
*This creates the `client/dist` folder.*

### Step B: Build Backend
```bash
cd ../server
npm install
npm run build
```
*This compiles TypeScript into the `server/dist` folder.*

---

## 4. Launching the System

Once built, you can start the production server:

```bash
cd server
npm start
```

Your system will be live at `http://localhost:4000` (or your configured port). The backend is configured to automatically serve the React frontend from the `client/dist` directory.

---

## 5. Security Checklist (Production)

1. **Role Access**: Ensure the initial seeding was successful so the `admin@fscm.com` account has "Admin" clearance.
2. **CORS**: Set `CLIENT_URL` in `server/.env` to the final domain name.
3. **SSL**: Deploy behind a reverse proxy (like Nginx) with Certbot (SSL/HTTPS) for secure transmissions.
4. **Secrets**: Never commit your `.env` files to version control.

---

## 📂 Project Structure Overview

```
FSCM/
├── client/              # React Frontend
│   ├── src/             # Logic & UI
│   └── dist/            # Compiled Production UI
├── server/              # Node.js Backend
│   ├── src/             # API & Logic
│   ├── prisma/          # DB Schema & Seeds
│   └── uploads/         # User Media Storage
├── package.json         # Master Scripts
└── deployment.md        # This Guide
```
