# Foodie Full-Stack Application

Production-ready 3-service architecture (without docker-compose):
- `frontend/` → Next.js + TypeScript + Tailwind + Axios
- `backend/` → Express + TypeScript + Prisma + JWT + Multer
- `database/` → PostgreSQL Docker image

## Environment Variables

### Backend (`backend/.env`)
Copy from `.env.example`:
```bash
DATABASE_URL="postgresql://foodie:foodie@database:5432/foodie"
JWT_SECRET="change_me"
PORT=5000
```

### Frontend (`frontend/.env.local`)
Copy from `.env.example`:
```bash
NEXT_PUBLIC_API_URL="http://localhost:5000"
```

## Build Docker Images

```bash
docker build -t foodie-frontend:latest ./frontend
docker build -t foodie-backend:latest ./backend
docker build -t foodie-database:latest ./database
```

## Run Containers Manually (No docker-compose)

```bash
docker network create foodie-net

docker run -d --name foodie-db --network foodie-net -p 5432:5432 foodie-database:latest

docker run -d --name foodie-backend --network foodie-net -p 5000:5000 \
  -e DATABASE_URL="postgresql://foodie:foodie@foodie-db:5432/foodie" \
  -e JWT_SECRET="change_me" \
  -e PORT=5000 \
  foodie-backend:latest

docker run -d --name foodie-frontend --network foodie-net -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL="http://localhost:5000" \
  foodie-frontend:latest
```

## Admin Seed Credentials
- Email: `admin@foodie.com`
- Password: `Areti123$`

## API Endpoints

### Auth
- `POST /api/auth/login`

### Menu
- `GET /api/menu`
- `POST /api/menu` (Admin)
- `PUT /api/menu/:id` (Admin)
- `DELETE /api/menu/:id` (Admin)

### Orders
- `POST /api/orders`
- `GET /api/orders` (Admin)
- `PUT /api/orders/:id` (Admin)

## Manual Docker Push

```bash
docker tag foodie-frontend:latest <dockerhub_user>/foodie-frontend:latest
docker tag foodie-backend:latest <dockerhub_user>/foodie-backend:latest
docker tag foodie-database:latest <dockerhub_user>/foodie-database:latest

docker push <dockerhub_user>/foodie-frontend:latest
docker push <dockerhub_user>/foodie-backend:latest
docker push <dockerhub_user>/foodie-database:latest
```
