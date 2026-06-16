import type { NextFunction, Response } from "express";
import { USER_ROLES } from "../models/User.model";
import type { AuthenticatedRequest } from "./auth.middleware";
import { forbidden } from "../utils/errors";

export function adminMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  if (req.user.role !== USER_ROLES.ADMIN) {
    next(forbidden("Admin access required", "ADMIN_REQUIRED"));
    return;
  }

  next();
}
