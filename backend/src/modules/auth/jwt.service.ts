import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { unauthorized } from "../../utils/errors";

export type JwtPayload = {
  sub: string;
  role: "USER" | "ADMIN";
  telegramId: string;
};

export class JwtService {
  static sign(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_SECRET as Secret, {
      expiresIn: env.JWT_EXPIRES_IN
    } as SignOptions);
  }

  static verify(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET as Secret);

      if (!decoded || typeof decoded === "string") {
        throw unauthorized("Invalid token", "INVALID_TOKEN");
      }

      return decoded as JwtPayload;
    } catch {
      throw unauthorized("Invalid or expired token", "INVALID_TOKEN");
    }
  }
}
