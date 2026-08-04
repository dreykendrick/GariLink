export declare abstract class AppError extends Error {
    abstract readonly code: string;
    abstract readonly statusCode: number;
    constructor(message: string);
}
export declare class BadRequestError extends AppError {
    readonly code: string;
    readonly statusCode = 400;
    constructor(message?: string);
}
export declare class ValidationError extends AppError {
    readonly code: string;
    readonly statusCode = 400;
    constructor(message: string);
}
export declare class UnauthorizedError extends AppError {
    readonly code: string;
    readonly statusCode = 401;
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    readonly code: string;
    readonly statusCode = 403;
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    readonly code: string;
    readonly statusCode = 404;
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    readonly code: string;
    readonly statusCode = 409;
    constructor(message?: string);
}
export declare class InternalError extends AppError {
    readonly code: string;
    readonly statusCode = 500;
    constructor(message?: string);
}
