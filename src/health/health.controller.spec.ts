import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("returns service health", () => {
    const controller = new HealthController();

    expect(controller.getHealth()).toMatchObject({
      status: "ok",
      service: "earnproof-api",
    });
  });
});
