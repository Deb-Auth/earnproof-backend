import { ConfigService } from "@nestjs/config";
import { AuthTokenService } from "./auth-token.service";

describe("AuthTokenService", () => {
  const service = new AuthTokenService({
    getOrThrow: () => "test_secret_123",
  } as unknown as ConfigService);

  it("signs and verifies auth token payloads", () => {
    const token = service.sign({
      id: "user_1",
      walletAddress: "G".padEnd(56, "A"),
      walletHash: "sha256:abc",
      role: "WORKER",
    });

    expect(service.verify(token)).toMatchObject({
      id: "user_1",
      walletHash: "sha256:abc",
      role: "WORKER",
    });
  });

  it("rejects tampered tokens", () => {
    const token = service.sign({
      id: "user_1",
      walletAddress: "G".padEnd(56, "A"),
      walletHash: "sha256:abc",
      role: "WORKER",
    });

    expect(() => service.verify(`${token}x`)).toThrow("Invalid auth token");
  });
});
