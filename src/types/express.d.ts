import { AuthTokenPayload } from "../auth/auth.types";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthTokenPayload;
  }
}
