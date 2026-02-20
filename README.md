# Foodie Full-Stack Application

## 1) Project Overview
Foodie is a pre-order food platform with:
- **Customer experience**: browse menu and place orders.
- **Admin/User portal**: login with JWT and access dashboard.
- **Admin operations**: manage menu, manage users/roles, inspect logs.
- **Operational visibility**: backend health checks and centralized logs.

### Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, Axios, Tailwind CSS
- **Backend**: Express, TypeScript, Prisma ORM, PostgreSQL, JWT, bcrypt
- **Database**: PostgreSQL (Docker)

---

## 2) Architecture Explanation
### Frontend
- App Router pages under `frontend/src/app`.
- Uses Axios client (`frontend/src/lib/api.ts`) for backend APIs.
- Stores auth token in `localStorage` and sends Bearer token via interceptor.
- Includes backend health indicator (poll every 30s).

### Backend
- Express APIs organized by routes/controllers/middleware.
- JWT auth middleware verifies token and applies role checks.
- Prisma handles DB reads/writes.
- File-based logging written to `/logs/backend.log` and `/logs/frontend.log`.

### Database
- Prisma schema defines:
  - `User` with `role` (`ADMIN`/`USER`)
  - `MenuItem`
  - `Order`

### Authentication Flow
- Login endpoint validates email/password.
- Password checked with bcrypt hash compare.
- JWT token signed with `JWT_SECRET`.
- Token contains `userId` and `role`.

### Logging System
- Backend logger writes structured JSON log lines to `/logs/backend.log`.
- Frontend actions are forwarded to `POST /api/logs` and saved to `/logs/frontend.log`.
- Admin can view logs from dashboard through protected APIs.

### Role-Based Access
- Middleware:
  - `authenticateToken`
  - `authorizeRole(...)`
- Admin-only APIs:
  - user create/delete/list
  - log viewing
  - menu/order mutation endpoints

---

## 3) Folder Structure
```txt
backend/
  prisma/
    schema.prisma
    seed.ts
    seed.js
  src/
    config/         # env, prisma, logger
    controllers/    # auth/menu/order/user/log/health
    middleware/     # auth, error, upload
    routes/         # route registration modules
    utils/          # jwt helpers
    app.ts
    server.ts
frontend/
  src/
    app/            # pages/layout
    components/     # AdminGuard, BackendStatus, etc.
    lib/            # api client, auth parsing, frontend logger
logs/
  backend.log
  frontend.log
database/
  Docker artifacts for postgres image
```

---

## 4) Authentication Flow Diagram (ASCII)
```txt
User -> Login Form -> POST /api/auth/login
     -> Validate Payload
     -> Find User By Email
     -> bcrypt.compare(password, hash)
     -> Generate JWT (userId, role, exp)
     -> Return Token + User
     -> Frontend stores token
     -> Access protected routes with Bearer token
```

## 5) Health Check Flow Diagram
```txt
UI (every 30s) -> GET /api/health -> Backend -> DB query (SELECT 1)
               -> JSON response (status, uptime, timestamp, database)
               -> UI shows Healthy/Disconnected indicator
```

## 6) Logging Flow Diagram
```txt
Frontend Action -> POST /api/logs -> Backend logger -> /logs/frontend.log
Backend Events  -> Logger utility ------------------> /logs/backend.log
Admin UI -> GET /api/logs/backend|frontend -> read logs
```

---

## 7) Setup Instructions

### Prerequisites
- Node.js 20+
- Docker (for containers)
- PostgreSQL reachable by backend

### Backend Environment (`backend/.env`)
Copy from `backend/.env.example` and set:
```bash
DATABASE_URL="postgresql://foodie:foodie@database:5432/foodie"
JWT_SECRET="change_me"
PORT=5000
ADMIN_SEED_EMAIL="admin@foodie.com"
ADMIN_SEED_PASSWORD="Areti123$"
LOG_LEVEL="info"
```

### Frontend Environment (`frontend/.env.local`)
```bash
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

### Install + Run (Local)
```bash
cd backend
npm install
npx prisma generate
npm run prisma:migrate
npm run prisma:seed
npm run dev

cd ../frontend
npm install
npm run dev
```

### Docker (manual)
```bash
docker network create foodie-net

docker run -d --name foodie-db --network foodie-net -p 5432:5432 foodie-database:latest

docker run -d --name foodie-backend --network foodie-net -p 5000:5000 \
  -e DATABASE_URL="postgresql://foodie:foodie@foodie-db:5432/foodie" \
  -e JWT_SECRET="change_me" \
  -e ADMIN_SEED_EMAIL="admin@foodie.com" \
  -e ADMIN_SEED_PASSWORD="Areti123$" \
  -e PORT=5000 \
  foodie-backend:latest

docker run -d --name foodie-frontend --network foodie-net -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL="http://localhost:5000" \
  foodie-frontend:latest
```

### Default Admin Credentials
- Email: `admin@foodie.com`
- Password: `Areti123$`

---

## 8) Security Notes
- Passwords are stored as bcrypt hashes (salt rounds 12).
- JWTs are signed by `JWT_SECRET` and expire in 12h.
- Role checks enforced server-side; frontend-only checks are not trusted.
- Log endpoints for viewing are admin-protected.
- Do not commit production secrets; always use environment variables.
