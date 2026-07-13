import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("returns service health", async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
    };
    const controller = new HealthController(prisma as never);

    await expect(controller.getHealth()).resolves.toMatchObject({
      status: "ok",
      service: "earnproof-api",
      database: "ok",
    });
  });
});
