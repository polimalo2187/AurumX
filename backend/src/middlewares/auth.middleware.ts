import type { NextFunction, Request, Response } from "express";
import { UserModel, USER_STATUSES, USER_ROLES, type User } from "../models/User.model";
import { unauthorized, forbidden } from "../utils/errors";
import { JwtService } from "../modules/auth/jwt.service";
import { isAdminPhone } from "../config/env";

export type AuthenticatedRequest = Request & {
  user: User;
};

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw unauthorized("Missing bearer token", "MISSING_TOKEN");
    }

    const token = authorization.slice("Bearer ".length).trim();
    const payload = JwtService.verify(token);

    const user = await UserModel.findById(payload.sub);

    if (!user) {
      throw unauthorized("User not found", "USER_NOT_FOUND");
    }

    if (user.status !== USER_STATUSES.ACTIVE) {
      throw forbidden("User is blocked", "USER_BLOCKED");
    }

    if (user.phoneVerified && user.role !== USER_ROLES.ADMIN && (isAdminPhone(user.phoneE164) || isAdminPhone(user.phoneNumber))) {
      user.role = USER_ROLES.ADMIN;
      await user.save();
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    next(error);
  }
}
