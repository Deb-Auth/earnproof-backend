# EarnProof Backend

NestJS API starter for EarnProof.

## Phase 0 Included

- NestJS application shell
- Versioned `/api/v1` prefix
- Environment validation
- Health endpoint
- Swagger documentation at `/docs`
- PostgreSQL and Redis Docker Compose services
- Initial Prisma schema
- Jest test setup

## Local Setup

```bash
npm install
cp .env.example .env
docker compose up -d
npm run prisma:generate
npm run start:dev
```

Health check:

```text
GET http://localhost:4000/api/v1/health
```
