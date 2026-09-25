import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Payment,
  PaymentClassification,
  Prisma,
  ResourceStatus,
} from "@prisma/client";
import { canonicalAssetId } from "../common/assets/asset-identifier";
import { encryptProtectedAmount } from "../common/crypto/protected-amount";
import { PaymentEncryptionKeyringService } from "../common/crypto/payment-encryption-keyring.service";
import { PrismaService } from "../database/prisma.service";
import { StellarService } from "../stellar/stellar.service";
import { normalizeMemo } from "../stellar/memo-normalizer";
import { NormalizedMemo } from "../stellar/stellar.types";

@Injectable()
export class PaymentsService {
  private readonly paymentEncryptionKey: string;
  private readonly stellarNetwork: string;
  private readonly paymentEncryptionKeyring: PaymentEncryptionKeyringService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly stellarService: StellarService,
    configService: ConfigService,
  ) {
    this.paymentEncryptionKeyring = new PaymentEncryptionKeyringService(
      configService,
    );
    this.stellarNetwork = configService.getOrThrow<string>("stellar.network");
  }

  async syncPayments(user: { id: string; walletAddress: string }) {
    const incomingPayments = await this.stellarService.fetchIncomingPayments(
      user.walletAddress,
    );
    // Eligibility is governed by the active asset definition for THIS
    // deployment's network. Without the network filter, a SupportedAsset row
    // seeded for a different network (e.g. mainnet) with the same code/issuer
    // as a testnet row - which happens for the native asset, since it has no
    // issuer to disambiguate networks - could make a payment eligible based
    // on the wrong network's policy.
    const supportedAssets = await this.prisma.supportedAsset.findMany({
      where: {
        status: ResourceStatus.ACTIVE,
        network: this.stellarNetwork,
      },
      select: {
        code: true,
        issuer: true,
        network: true,
      },
    });
    const supportedAssetKeys = new Set(
      supportedAssets.map((asset) =>
        canonicalAssetId({
          network: asset.network,
          code: asset.code,
          issuer: asset.issuer,
        }),
      ),
    );

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let enrichmentErrors = 0;
    const memoCache = new Map<string, NormalizedMemo>();

    // Batch the "does this payment already exist" check into a single query
    // ahead of the loop, instead of one findUnique per incoming payment.
    // incomingPayments comes from Stellar Horizon and can run into the
    // hundreds for an active wallet; a query per row turned a sync into N+1
    // round trips to the database on top of the (already-batched) N calls to
    // Horizon for memo enrichment.
    const existingOperationIds = new Set(
      (
        await this.prisma.payment.findMany({
          where: {
            operationId: {
              in: incomingPayments.map((payment) => payment.operationId),
            },
          },
          select: { operationId: true },
        })
      ).map((row) => row.operationId),
    );

    for (const payment of incomingPayments) {
      const isEligible = supportedAssetKeys.has(
        canonicalAssetId({
          network: this.stellarNetwork,
          code: payment.assetCode,
          issuer: payment.assetIssuer,
        }),
      );

      if (!isEligible) {
        skipped += 1;
      }

      let memoContext = memoCache.get(payment.stellarTransactionHash);
      if (!memoContext) {
        try {
          const transaction = await this.stellarService.fetchTransaction(
            payment.stellarTransactionHash,
          );
          if (!transaction) {
            enrichmentErrors += 1;
          }
          memoContext = normalizeMemo(transaction);
        } catch {
          enrichmentErrors += 1;
          memoContext = { type: "none" };
        }
        memoCache.set(payment.stellarTransactionHash, memoContext);
      }

      const existing = existingOperationIds.has(payment.operationId);

      await this.prisma.payment.upsert({
        where: {
          operationId: payment.operationId,
        },
        update: {
          isEligible,
          occurredAt: payment.occurredAt,
          memo: memoContext as Prisma.InputJsonValue,
        },
        create: {
          userId: user.id,
          operationId: payment.operationId,
          stellarTransactionHash: payment.stellarTransactionHash,
          sourceAddress: payment.sourceAddress,
          destinationAddress: payment.destinationAddress,
          assetCode: payment.assetCode,
          assetIssuer: payment.assetIssuer,
          amountEncrypted: this.protectAmount(payment.amount),
          occurredAt: payment.occurredAt,
          memo: memoContext as Prisma.InputJsonValue,
          classification: PaymentClassification.UNKNOWN,
          isEligible,
        },
      });

      if (existing) {
        updated += 1;
      } else {
        created += 1;
      }
    }

    return {
      totalFetched: incomingPayments.length,
      created,
      updated,
      skipped,
      enrichmentErrors,
    };
  }

  async listPayments(
    userId: string,
    filters: { classification?: PaymentClassification; assetCode?: string },
  ) {
    const payments = await this.prisma.payment.findMany({
      where: {
        userId,
        classification: filters.classification,
        assetCode: filters.assetCode,
      },
      orderBy: {
        occurredAt: "desc",
      },
      take: 100,
    });

    return payments.map((payment) => this.toPaymentDto(payment));
  }

  async getPayment(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    return this.toPaymentDto(payment);
  }

  async updateClassification(
    user: { id: string },
    paymentId: string,
    classification: PaymentClassification,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: user.id,
      },
      select: {
        id: true,
        classification: true,
        assetCode: true,
        assetIssuer: true,
        isEligible: true,
      },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    const updated = await this.prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        classification,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorType: "user",
        actorId: user.id,
        action: "payment.classification.updated",
        resourceType: "payment",
        resourceId: payment.id,
        metadata: {
          previousClassification: payment.classification,
          nextClassification: classification,
          assetCode: payment.assetCode,
          assetIssuer: payment.assetIssuer,
          isEligible: payment.isEligible,
        },
      },
    });

    return this.toPaymentDto(updated);
  }

  private protectAmount(amount: string) {
    return this.paymentEncryptionKeyring.encrypt(amount);
  }

  private toPaymentDto(payment: Payment) {
    return {
      id: payment.id,
      operationId: payment.operationId,
      stellarTransactionHash: payment.stellarTransactionHash,
      sourceAddress: payment.sourceAddress,
      destinationAddress: payment.destinationAddress,
      assetCode: payment.assetCode,
      assetIssuer: payment.assetIssuer,
      occurredAt: payment.occurredAt,
      classification: payment.classification,
      isEligible: payment.isEligible,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      memoContext: this.readMemoContext(payment.memo),
    };
  }

  private readMemoContext(memo: Prisma.JsonValue | null): NormalizedMemo {
    if (!memo || typeof memo !== "object" || Array.isArray(memo)) {
      return { type: "none" };
    }

    const stored = memo as Record<string, Prisma.JsonValue>;
    if (stored.type === "none") {
      return { type: "none" };
    }

    if (typeof stored.type !== "string" || typeof stored.value !== "string") {
      return { type: "none" };
    }

    if (stored.type === "text") {
      return {
        type: "text",
        value: Array.from(stored.value).slice(0, 500).join(""),
        truncated: stored.truncated === true,
      };
    }

    return normalizeMemo({
      memo_type: stored.type === "return_hash" ? "return" : stored.type,
      memo: stored.value,
    });
  }
}
