-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('WORKER', 'ISSUER', 'ADMIN', 'DEVELOPER');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'REVOKED', 'DELETED');

-- CreateEnum
CREATE TYPE "PaymentClassification" AS ENUM ('INCOME', 'REIMBURSEMENT', 'PERSONAL_TRANSFER', 'UNKNOWN', 'EXCLUDED');

-- CreateEnum
CREATE TYPE "ProofStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'INVALID');

-- CreateEnum
CREATE TYPE "ProofType" AS ENUM ('MINIMUM_INCOME', 'RECURRING_INCOME', 'PAYMENT_RECEIPT', 'INCOME_RANGE', 'EMPLOYER_PAYMENT', 'EMPLOYMENT_CONTINUITY', 'INVOICE_SETTLEMENT', 'AGGREGATE_EARNINGS');

-- CreateEnum
CREATE TYPE "AttestationType" AS ENUM ('PAYMENT', 'EMPLOYMENT', 'INVOICE');

-- CreateEnum
CREATE TYPE "VerificationResult" AS ENUM ('VALID', 'EXPIRED', 'REVOKED', 'INVALID_SIGNATURE', 'UNKNOWN_PROOF', 'UNVERIFIED_ISSUER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "walletHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'WORKER',
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletChallenge" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "nonceHash" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "status" "ResourceStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issuer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "stellarAddress" TEXT NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'PENDING',
    "metadataHash" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issuer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportedAsset" (
    "id" TEXT NOT NULL,
    "assetKey" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "issuer" TEXT,
    "network" TEXT NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportedAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stellarTransactionHash" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "sourceAddress" TEXT NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "assetIssuer" TEXT,
    "amountEncrypted" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "memo" TEXT,
    "classification" "PaymentClassification" NOT NULL DEFAULT 'UNKNOWN',
    "isEligible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustedSource" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceAddress" TEXT NOT NULL,
    "displayName" TEXT,
    "sourceType" TEXT NOT NULL,
    "issuerId" TEXT,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustedSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proof" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "proofType" "ProofType" NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "status" "ProofStatus" NOT NULL DEFAULT 'ACTIVE',
    "network" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "assetIssuer" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "commitment" TEXT,
    "credentialHash" TEXT NOT NULL,
    "contractTransactionHash" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofClaim" (
    "id" TEXT NOT NULL,
    "proofId" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "thresholdEncrypted" TEXT,
    "frequency" TEXT,
    "result" BOOLEAN NOT NULL,
    "disclosurePolicy" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProofClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attestation" (
    "id" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    "subjectWalletHash" TEXT NOT NULL,
    "paymentReferenceHash" TEXT,
    "type" "AttestationType" NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "signedPayload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationEvent" (
    "id" TEXT NOT NULL,
    "proofId" TEXT NOT NULL,
    "verifierFingerprint" TEXT,
    "result" "VerificationResult" NOT NULL,
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "events" JSONB NOT NULL,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
CREATE UNIQUE INDEX "User_walletHash_key" ON "User"("walletHash");
CREATE INDEX "User_walletHash_idx" ON "User"("walletHash");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE UNIQUE INDEX "WalletChallenge_nonceHash_key" ON "WalletChallenge"("nonceHash");
CREATE INDEX "WalletChallenge_walletAddress_idx" ON "WalletChallenge"("walletAddress");
CREATE INDEX "WalletChallenge_expiresAt_idx" ON "WalletChallenge"("expiresAt");
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_status_idx" ON "Organization"("status");
CREATE UNIQUE INDEX "Issuer_stellarAddress_key" ON "Issuer"("stellarAddress");
CREATE INDEX "Issuer_organizationId_idx" ON "Issuer"("organizationId");
CREATE INDEX "Issuer_status_idx" ON "Issuer"("status");
CREATE UNIQUE INDEX "SupportedAsset_assetKey_key" ON "SupportedAsset"("assetKey");
CREATE INDEX "SupportedAsset_network_status_idx" ON "SupportedAsset"("network", "status");
CREATE UNIQUE INDEX "Payment_operationId_key" ON "Payment"("operationId");
CREATE INDEX "Payment_userId_occurredAt_idx" ON "Payment"("userId", "occurredAt");
CREATE INDEX "Payment_sourceAddress_idx" ON "Payment"("sourceAddress");
CREATE INDEX "Payment_assetCode_assetIssuer_idx" ON "Payment"("assetCode", "assetIssuer");
CREATE INDEX "Payment_classification_idx" ON "Payment"("classification");
CREATE INDEX "TrustedSource_issuerId_idx" ON "TrustedSource"("issuerId");
CREATE UNIQUE INDEX "TrustedSource_userId_sourceAddress_key" ON "TrustedSource"("userId", "sourceAddress");
CREATE UNIQUE INDEX "Proof_credentialHash_key" ON "Proof"("credentialHash");
CREATE INDEX "Proof_userId_status_idx" ON "Proof"("userId", "status");
CREATE INDEX "Proof_proofType_idx" ON "Proof"("proofType");
CREATE INDEX "Proof_expiresAt_idx" ON "Proof"("expiresAt");
CREATE UNIQUE INDEX "ProofClaim_proofId_key" ON "ProofClaim"("proofId");
CREATE INDEX "Attestation_issuerId_status_idx" ON "Attestation"("issuerId", "status");
CREATE INDEX "Attestation_subjectWalletHash_idx" ON "Attestation"("subjectWalletHash");
CREATE INDEX "VerificationEvent_proofId_createdAt_idx" ON "VerificationEvent"("proofId", "createdAt");
CREATE INDEX "VerificationEvent_result_idx" ON "VerificationEvent"("result");
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");
CREATE INDEX "ApiKey_organizationId_status_idx" ON "ApiKey"("organizationId", "status");
CREATE INDEX "Webhook_organizationId_status_idx" ON "Webhook"("organizationId", "status");
CREATE INDEX "AuditLog_actorType_actorId_idx" ON "AuditLog"("actorType", "actorId");
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Issuer" ADD CONSTRAINT "Issuer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrustedSource" ADD CONSTRAINT "TrustedSource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrustedSource" ADD CONSTRAINT "TrustedSource_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "Issuer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Proof" ADD CONSTRAINT "Proof_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProofClaim" ADD CONSTRAINT "ProofClaim_proofId_fkey" FOREIGN KEY ("proofId") REFERENCES "Proof"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "Issuer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VerificationEvent" ADD CONSTRAINT "VerificationEvent_proofId_fkey" FOREIGN KEY ("proofId") REFERENCES "Proof"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
