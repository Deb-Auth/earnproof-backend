# EarnProof Backend

EarnProof is an open-source, privacy-focused income and payment verification protocol built on Stellar.

This repository contains the NestJS API for wallet authentication, Stellar payment indexing, payment classification, and operational health. Proof condition evaluation, credential signing, verification, revocation, issuer management, webhooks, API keys, and audit logs are planned but not yet wired into the application.

## Product Role

The backend is the trust and verification service for EarnProof. It should let workers create signed credentials from qualifying Stellar testnet payments while preventing verifiers from seeing full wallet history, unrelated transactions, total balances, or hidden income details.

The first implementation targets Stellar testnet, Freighter wallet authentication, and signed JSON credentials.

## Current Scope

Implemented:

- NestJS application shell
- Versioned `/api/v1` prefix
- Environment validation
- Swagger documentation at `/docs`
- Health endpoint at `/api/v1/health`
- Wallet challenge generation at `/api/v1/auth/challenge`
- Freighter-compatible challenge verification at `/api/v1/auth/verify`
- Bearer-token session lookup and logout endpoints
- Incoming Stellar testnet payment synchronization at `/api/v1/payments/sync`
- Authenticated payment listing, detail lookup, and manual classification
- PostgreSQL and Redis Docker Compose services
- Prisma lifecycle service
- Prisma schema for core product entities
- Initial database migration
- Seed script for native XLM testnet asset
- Jest tests for auth, token handling, health, Stellar payment mapping, and payment sync/classification

Core entities currently modeled:

- Users
- Wallet challenges
- Organizations
- Issuers
- Supported assets
- Payments
- Trusted sources
- Proofs
- Proof claims
- Attestations
- Verification events
- API keys
- Webhooks
- Audit logs

Planned next:

- Proof generation
- Credential signing and verification
- Public verification endpoints
- Revocation workflow
- Issuer management
- Webhooks and API keys
- Contract anchoring

## Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- Prisma
- Redis
- Stellar JavaScript SDK
- BullMQ, planned for background jobs
- OpenAPI/Swagger
- Jest
- Docker Compose

## Repository Structure

```text
src/
  app.module.ts
  main.ts
  auth/
  config/
  common/
  database/
  health/
  payments/
  stellar/
prisma/
  schema.prisma
  seed.ts
  migrations/
test/
docs/
```

## Local Setup

```bash
npm install
cp .env.example .env
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

Default local API:

```text
http://localhost:4000/api/v1
```

Health check:

```text
GET http://localhost:4000/api/v1/health
```

Swagger docs:

```text
http://localhost:4000/docs
```

## Environment Variables

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://earnproof:earnproof@localhost:5432/earnproof
REDIS_URL=redis://localhost:6379
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
SESSION_SECRET=replace_me
CREDENTIAL_SIGNING_SECRET=replace_me
```

Use strong secrets outside local development. Do not commit `.env`.

## Validation

```bash
npm run prisma:generate
npm run lint
npm run test
npm run build
```

Prisma validation:

```bash
$env:DATABASE_URL='postgresql://earnproof:earnproof@localhost:5432/earnproof'
npx prisma validate
```

## Privacy and Security Requirements

- Do not log raw wallet signatures.
- Do not log exact income values.
- Do not expose selected source transactions to verifiers.
- Store API keys as hashes only.
- Store webhook secrets as hashes or encrypted values.
- Hash wallet identifiers in public proof payloads.
- Keep credential signing keys out of source control.
- Treat public verification responses as intentionally disclosed data only.
- Keep Stellar mainnet disabled until contracts and security posture are reviewed.

## Related Repositories

- `earnproof-frontend`: Public app, worker dashboard, issuer UI, verifier UI, and admin UI.
- `earnproof-contracts`: Soroban issuer registry, proof commitment registry, revocation state, and protocol configuration.
- `earnproof-sdk`: Future TypeScript SDK for integrations.
- `earnproof-specification`: Future credential and verification standard.
