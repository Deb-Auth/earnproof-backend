import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthTokenService } from "./auth-token.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthTokenService],
  exports: [AuthTokenService],
})
export class AuthModule {}
