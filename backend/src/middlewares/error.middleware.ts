import type { ErrorRequestHandler } from "express";
import { isProduction } from "../config/env";
import { AppError } from "../utils/errors";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
      details: error.details
    });
    return;
  }

  console.error("Unhandled error:", error);

  res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    message: isProduction ? "Internal server error" : error.message
  });
};
