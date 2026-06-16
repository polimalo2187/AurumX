import type { NextFunction, Request, Response } from "express";
import { USER_ROLES } from "../models/User.model";
import type { AuthenticatedRequest } from "./auth.middleware";
import { forbidden } from "../utils/errors";

export function adminMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;

  if (authReq.user.role !== USER_ROLES.ADMIN) {
    next(forbidden("Admin access required", "ADMIN_REQUIRED"));
    return;
  }

  next();
}
