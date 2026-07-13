import { Injectable, NotFoundException } from "@nestjs/common";
import { PaymentClassification, ResourceStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { StellarService } from "../stellar/stellar.service";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stellarService: StellarService,
  ) {}

  async syncPayments(user: { id: string; walletAddress: string }) {
    const incomingPayments = await this.stellarService.fetchIncomingPayments(
      user.walletAddress,
    );
    const supportedAssets = await this.prisma.supportedAsset.findMany({
      where: {
        status: ResourceStatus.ACTIVE,
      },
      select: {
        code: true,
        issuer: true,
        network: true,
      },
    });
    const supportedAssetKeys = new Set(
      supportedAssets.map((asset) => this.assetKey(asset.code, asset.issuer)),
    );

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const payment of incomingPayments) {
      const isEligible = supportedAssetKeys.has(
        this.assetKey(payment.assetCode, payment.assetIssuer),
      );

      if (!isEligible) {
        skipped += 1;
      }

      const existing = await this.prisma.payment.findUnique({
        where: {
          operationId: payment.operationId,
        },
        select: {
          id: true,
        },
      });

      await this.prisma.payment.upsert({
        where: {
          operationId: payment.operationId,
        },
        update: {
          isEligible,
          occurredAt: payment.occurredAt,
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
    };
  }

  listPayments(
    userId: string,
    filters: { classification?: PaymentClassification; assetCode?: string },
  ) {
    return this.prisma.payment.findMany({
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

    return payment;
  }

  private assetKey(code: string, issuer: string | null) {
    return `${code}:${issuer ?? "native"}`;
  }

  private protectAmount(amount: string) {
    return `redacted:${Buffer.from(amount).toString("base64url")}`;
  }
}
