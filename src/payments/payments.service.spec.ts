import { PaymentClassification, ResourceStatus } from "@prisma/client";
import { PaymentsService } from "./payments.service";

describe("PaymentsService", () => {
  it("syncs incoming payments idempotently", async () => {
    const prisma = {
      supportedAsset: {
        findMany: jest.fn().mockResolvedValue([
          { code: "XLM", issuer: null, network: "stellar-testnet" },
        ]),
      },
      payment: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: "payment_1" }),
      },
    };
    const stellar = {
      fetchIncomingPayments: jest.fn().mockResolvedValue([
        {
          operationId: "op_1",
          stellarTransactionHash: "tx_1",
          sourceAddress: "GA",
          destinationAddress: "GB",
          assetCode: "XLM",
          assetIssuer: null,
          amount: "10",
          occurredAt: new Date("2026-07-13T00:00:00Z"),
        },
      ]),
    };
    const service = new PaymentsService(prisma as never, stellar as never);

    await expect(
      service.syncPayments({ id: "user_1", walletAddress: "GB" }),
    ).resolves.toEqual({
      totalFetched: 1,
      created: 1,
      updated: 0,
      skipped: 0,
    });

    expect(prisma.supportedAsset.findMany).toHaveBeenCalledWith({
      where: { status: ResourceStatus.ACTIVE },
      select: { code: true, issuer: true, network: true },
    });
    expect(prisma.payment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          classification: PaymentClassification.UNKNOWN,
          isEligible: true,
        }),
      }),
    );
  });
});
