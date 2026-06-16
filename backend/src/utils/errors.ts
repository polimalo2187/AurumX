export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function badRequest(message: string, code = "BAD_REQUEST", details?: unknown): AppError {
  return new AppError(message, 400, code, details);
}

export function unauthorized(message = "Unauthorized", code = "UNAUTHORIZED"): AppError {
  return new AppError(message, 401, code);
}

export function forbidden(message = "Forbidden", code = "FORBIDDEN"): AppError {
  return new AppError(message, 403, code);
}

export function notFound(message = "Not found", code = "NOT_FOUND"): AppError {
  return new AppError(message, 404, code);
}

export function conflict(message: string, code = "CONFLICT", details?: unknown): AppError {
  return new AppError(message, 409, code, details);
}
