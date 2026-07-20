// ─── Base Error ──────────────────────────────────────────────────────────────

export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── 400 Bad Request ─────────────────────────────────────────────────────────

export class BadRequestError extends AppError {
  readonly code: string = 'BAD_REQUEST';
  readonly statusCode = 400;

  constructor(message = 'Bad request') {
    super(message);
  }
}

export class ValidationError extends AppError {
  readonly code: string = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

// ─── 401 Unauthorized ────────────────────────────────────────────────────────

export class UnauthorizedError extends AppError {
  readonly code: string = 'UNAUTHORIZED';
  readonly statusCode = 401;

  constructor(message = 'Unauthorized') {
    super(message);
  }
}

// ─── 403 Forbidden ───────────────────────────────────────────────────────────

export class ForbiddenError extends AppError {
  readonly code: string = 'FORBIDDEN';
  readonly statusCode = 403;

  constructor(message = 'Forbidden') {
    super(message);
  }
}

// ─── 404 Not Found ───────────────────────────────────────────────────────────

export class NotFoundError extends AppError {
  readonly code: string = 'NOT_FOUND';
  readonly statusCode = 404;

  constructor(message = 'Resource not found') {
    super(message);
  }
}

// ─── 409 Conflict ────────────────────────────────────────────────────────────

export class ConflictError extends AppError {
  readonly code: string = 'CONFLICT';
  readonly statusCode = 409;

  constructor(message = 'Resource already exists') {
    super(message);
  }
}

// ─── 500 Internal ────────────────────────────────────────────────────────────

export class InternalError extends AppError {
  readonly code: string = 'INTERNAL_ERROR';
  readonly statusCode = 500;

  constructor(message = 'An unexpected error occurred') {
    super(message);
  }
}
