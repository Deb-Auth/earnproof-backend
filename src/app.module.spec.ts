import { Test } from "@nestjs/testing";

describe("AppModule", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      APP_URL: "http://localhost:3000",
      API_URL: "http://localhost:4000",
      CREDENTIAL_SIGNING_SECRET: "credential_secret_123",
      DATABASE_URL: "postgresql://user:password@localhost:5432/earnproof",
      PAYMENT_ENCRYPTION_KEY:
        "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
      REDIS_URL: "redis://localhost:6379",
      SESSION_SECRET: "session_secret_123",
      STELLAR_HORIZON_URL: "https://horizon-testnet.stellar.org",
      STELLAR_NETWORK: "testnet",
      STELLAR_NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("compiles the application dependency graph", async () => {
    const { AppModule } = await import("./app.module");
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await moduleRef.close();
  });
});
