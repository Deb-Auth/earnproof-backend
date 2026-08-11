# Contributing to EarnProof Backend

This repository contains the EarnProof API service for wallet authentication, Stellar payment indexing, proof issuance, and verification.

## Setup

```bash
npm install
cp .env.example .env
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

Default local API: `http://localhost:4000/api/v1`.

## Validation

Run these before opening a pull request:

```bash
npm run prisma:generate
npm run lint
npm test -- --runInBand
npm run build
```

## Contribution Expectations

- Keep changes scoped to the issue being solved.
- Do not commit private keys, seed phrases, wallet signatures, raw payment history, or real income data.
- Add unit or integration tests for behavior changes.
- Keep public verification responses privacy-safe.
- Update API documentation when request or response shapes change.
- Keep database migrations intentional and reviewable.

## Definition of Done

- Acceptance criteria are satisfied.
- Lint, tests, Prisma generation, and build pass.
- New behavior has meaningful tests or fixtures.
- Public API responses disclose only intended proof data.
- Documentation and README state what is implemented accurately.

