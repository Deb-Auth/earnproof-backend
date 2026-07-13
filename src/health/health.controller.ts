import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: "ok",
      service: "earnproof-api",
      timestamp: new Date().toISOString(),
    };
  }
}
