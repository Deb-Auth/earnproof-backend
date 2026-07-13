import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { AuthTokenService } from "../../auth/auth-token.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authTokenService: AuthTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = header.slice("Bearer ".length);
    request.user = this.authTokenService.verify(token);

    return true;
  }
}
