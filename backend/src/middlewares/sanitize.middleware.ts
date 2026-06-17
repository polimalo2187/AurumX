import type { NextFunction, Request, Response } from "express";
import { badRequest } from "../utils/errors";

function assertSafeObject(value: unknown, path = "payload"): void {
  if (!value || typeof value !== "object") return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeObject(item, `${path}[${index}]`));
    return;
  }

  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    if (key.startsWith("$") || key.includes(".")) {
      throw badRequest(
        `Unsafe key detected at ${path}.${key}`,
        "UNSAFE_PAYLOAD_KEY"
      );
    }

    assertSafeObject(nestedValue, `${path}.${key}`);
  }
}

export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    assertSafeObject(req.body, "body");
    assertSafeObject(req.query, "query");
    assertSafeObject(req.params, "params");
    next();
  } catch (error) {
    next(error);
  }
}
