import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { forbidden } from "../utils/errors";
import { authMiddleware, type AuthenticatedRequest } from "./auth.middleware";
import { adminMiddleware } from "./admin.middleware";

export function internalOrAdminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const internalSecret = req.headers["x-internal-job-secret"];

  if (
    env.INTERNAL_JOB_SECRET &&
    typeof internalSecret === "string" &&
    internalSecret === env.INTERNAL_JOB_SECRET
  ) {
    next();
    return;
  }

  authMiddleware(req, res, (authError?: unknown) => {
    if (authError) {
      next(authError);
      return;
    }

    adminMiddleware(req as AuthenticatedRequest, res, (adminError?: unknown) => {
      if (adminError) {
        next(adminError);
        return;
      }

      next();
    });
  });
}

export function requireInternalSecret(req: Request, _res: Response, next: NextFunction): void {
  const internalSecret = req.headers["x-internal-job-secret"];

  if (
    !env.INTERNAL_JOB_SECRET ||
    typeof internalSecret !== "string" ||
    internalSecret !== env.INTERNAL_JOB_SECRET
  ) {
    next(forbidden("Internal job secret required", "INTERNAL_JOB_SECRET_REQUIRED"));
    return;
  }

  next();
}
