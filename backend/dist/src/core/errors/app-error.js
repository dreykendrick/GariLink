"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.BadRequestError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message);
        this.code = 'BAD_REQUEST';
        this.statusCode = 400;
    }
}
exports.BadRequestError = BadRequestError;
class ValidationError extends AppError {
    constructor(message) {
        super(message);
        this.code = 'VALIDATION_ERROR';
        this.statusCode = 400;
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message);
        this.code = 'UNAUTHORIZED';
        this.statusCode = 401;
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message);
        this.code = 'FORBIDDEN';
        this.statusCode = 403;
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message);
        this.code = 'NOT_FOUND';
        this.statusCode = 404;
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message);
        this.code = 'CONFLICT';
        this.statusCode = 409;
    }
}
exports.ConflictError = ConflictError;
class InternalError extends AppError {
    constructor(message = 'An unexpected error occurred') {
        super(message);
        this.code = 'INTERNAL_ERROR';
        this.statusCode = 500;
    }
}
exports.InternalError = InternalError;
//# sourceMappingURL=app-error.js.map