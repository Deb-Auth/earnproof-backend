import { ConfigService } from "@nestjs/config";
import { AuthTokenService } from "./auth-token.service";
import { AuthService } from "./auth.service";

jest.mock("@stellar/stellar-sdk", () => ({
  Keypair: {
    fromPublicKey: jest.fn(() => ({
      verify: jest.fn(() => true),
    })),
  },
  StrKey: {
    isValidEd25519PublicKey: jest.fn(() => true),
  },
}));

describe("AuthService", () => {
  const walletAddress = "G".padEnd(56, "A");
  const challenge = {
    id: "challenge_1",
    walletAddress,
    message: "EarnProof wallet authentication",
    expiresAt: new Date(Date.now() + 60_000),
    usedAt: null,
  };

  const prisma = {
    walletChallenge: {
      create: jest.fn().mockResolvedValue(challenge),
      findFirst: jest.fn().mockResolvedValue(challenge),
      update: jest.fn().mockResolvedValue({ ...challenge, usedAt: new Date() }),
    },
    user: {
      upsert: jest.fn().mockResolvedValue({
        id: "user_1",
        walletAddress,
        walletHash: "sha256:hash",
        role: "WORKER",
      }),
      findUnique: jest.fn(),
    },
  };

  const config = {
    getOrThrow: (key: string) => {
      const values: Record<string, string> = {
        appUrl: "http://localhost:3000",
        "stellar.networkPassphrase": "Test SDF Network ; September 2015",
        sessionSecret: "test_secret_123",
      };
      return values[key];
    },
  } as ConfigService;

  const service = new AuthService(
    prisma as never,
    new AuthTokenService(config),
    config,
  );

  it("creates wallet challenges", async () => {
    await expect(service.createChallenge(walletAddress)).resolves.toMatchObject({
      id: "challenge_1",
      walletAddress,
    });
  });

  it("verifies signatures and returns bearer session", async () => {
    await expect(
      service.verifyChallenge({
        challengeId: challenge.id,
        walletAddress,
        signature: Buffer.from("signature").toString("base64"),
      }),
    ).resolves.toMatchObject({
      user: {
        id: "user_1",
        walletAddress,
      },
      session: {
        tokenType: "Bearer",
      },
    });
  });
});
