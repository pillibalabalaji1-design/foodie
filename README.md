# Foodie Full-Stack Application

Production-ready 3-service architecture (without docker-compose):
- `frontend/` → Next.js + TypeScript + Tailwind + Axios
- `backend/` → Express + TypeScript + Prisma + JWT + Multer
- `database/` → PostgreSQL Docker image

---

## 1) Prerequisites

Make sure Docker is installed and running.

```bash
docker --version
docker info
```

You should be able to run Docker commands without errors before continuing.

---

## 2) Build all Docker images locally

From the repository root (`/workspace/foodie`):

```bash
docker build -t foodie-frontend:latest ./frontend
docker build -t foodie-backend:latest ./backend
docker build -t foodie-database:latest ./database
```

Optional quick check:

```bash
docker images | grep foodie-
```

---

## 3) Create an isolated Docker network

This allows containers to talk to each other using container names.

```bash
docker network create foodie-net
```

If the network already exists, Docker will return an "already exists" message which is safe to ignore.

---

## 4) Start PostgreSQL container

```bash
docker run -d \
  --name foodie-db \
  --network foodie-net \
  -p 5432:5432 \
  foodie-database:latest
```

Check logs:

```bash
docker logs -f foodie-db
```

Wait until you see PostgreSQL ready to accept connections, then continue.

---

## 5) Start backend container

The backend runs Prisma migrations and seed automatically at startup.

```bash
docker run -d \
  --name foodie-backend \
  --network foodie-net \
  -p 5000:5000 \
  -e DATABASE_URL="postgresql://foodie:foodie@foodie-db:5432/foodie" \
  -e JWT_SECRET="change_me" \
  -e PORT=5000 \
  foodie-backend:latest
```

Watch backend logs:

```bash
docker logs -f foodie-backend
```

You should see migration/seed completion and server startup.

---

## 6) Start frontend container

```bash
docker run -d \
  --name foodie-frontend \
  --network foodie-net \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL="http://localhost:5000" \
  foodie-frontend:latest
```

Check logs:

```bash
docker logs -f foodie-frontend
```

---

## 7) Access application on localhost

- Frontend UI: `http://localhost:3000`
- Backend API base: `http://localhost:5000`

### Default admin credentials (seeded)
- Email: `admin@foodie.com`
- Password: `Admin@123`

---

## 8) Validate that containers are running

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected containers:
- `foodie-db`
- `foodie-backend`
- `foodie-frontend`

---

## 9) Useful local API testing commands

### Login (get JWT)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@foodie.com",
    "password":"Admin@123"
  }'
```

### Get menu

```bash
curl http://localhost:5000/api/menu
```

---

## 10) Stop / restart / cleanup

### Stop containers

```bash
docker stop foodie-frontend foodie-backend foodie-db
```

### Start again

```bash
docker start foodie-db foodie-backend foodie-frontend
```

### Remove containers

```bash
docker rm -f foodie-frontend foodie-backend foodie-db
```

### Remove network

```bash
docker network rm foodie-net
```

### Remove images (optional)

```bash
docker rmi foodie-frontend:latest foodie-backend:latest foodie-database:latest
```

---

## 11) Troubleshooting

### Port already in use
If `3000`, `5000`, or `5432` are busy, stop the conflicting process/container or remap ports:

```bash
# Example alternate frontend port
docker run -d --name foodie-frontend --network foodie-net -p 3001:3000 \
  -e NEXT_PUBLIC_API_URL="http://localhost:5000" foodie-frontend:latest
```

Then open `http://localhost:3001`.

### Backend cannot connect to DB
Make sure backend uses this host in `DATABASE_URL`:

```text
foodie-db
```

(`foodie-db` is the database container name on `foodie-net`, not `localhost` from inside container network.)

### Inspect logs quickly

```bash
docker logs --tail 200 foodie-db
docker logs --tail 200 foodie-backend
docker logs --tail 200 foodie-frontend
```

---

## 12) Optional: Push images to Docker Hub manually

```bash
docker tag foodie-frontend:latest <dockerhub_user>/foodie-frontend:latest
docker tag foodie-backend:latest <dockerhub_user>/foodie-backend:latest
docker tag foodie-database:latest <dockerhub_user>/foodie-database:latest

docker push <dockerhub_user>/foodie-frontend:latest
docker push <dockerhub_user>/foodie-backend:latest
docker push <dockerhub_user>/foodie-database:latest
```
