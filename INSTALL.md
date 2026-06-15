# Deployment Guide: Docker & Production

This guide provides instructions for deploying the Redroom platform using Docker containers.

## 1. Prerequisites
- **Docker** and **Docker Compose** (V2 recommended).
- Access to the internet (to pull images and dependencies).
- The `server/_core` directory must be present in the repository (it contains the runtime engine).

## 2. Environment Configuration
Copy `.env.example` to `.env` and fill in the required secrets:

```bash
cp .env.example .env
```

Key variables to set:
- `JWT_SECRET`: Random string for session signing.
- `ADMIN_SECRET_KEY`: Random string for CMS access.
- `DATABASE_URL`: If using Docker Compose, this is pre-configured to `postgres://redroom_user:redroom_password@db:5432/redroom`.

## 3. Quick Start (Docker Compose)

To build and start the entire stack (Application + PostgreSQL):

```bash
docker compose up -d --build
```

The application will be available at `http://localhost:5000`.

## 4. Database Migrations
After the containers are up, run the migrations to set up the database schema:

```bash
docker compose exec app pnpm db:push
```

## 5. Initial Data Seeding (Optional)
To populate the database with initial intelligence data, agencies, and facilities:

```bash
# General seed
docker compose exec app pnpm exec tsx server/seed.ts

# Specific seeds (examples)
docker compose exec app pnpm exec tsx scripts/seed-all-countries.mjs
docker compose exec app pnpm exec tsx scripts/seed-global-agencies.mjs
```

## 6. Monitoring & Logs
To view logs:
```bash
docker compose logs -f app
```

To check the status of containers:
```bash
docker compose ps
```

## 6. Manual Docker Build
If you wish to build the image manually without Docker Compose:

```bash
docker build -t redroom-app .
docker run -p 5000:5000 --env-file .env redroom-app
```

## 7. Air-Gapped Deployment
For deployment in isolated networks, refer to the [Air-Gapped Deployment Guide](./docs/AIRGAP.md).
