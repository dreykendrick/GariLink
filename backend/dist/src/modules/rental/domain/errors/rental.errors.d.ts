import { BadRequestError, NotFoundError, ForbiddenError } from '../../../../core/errors/app-error';
export declare class RentalNotFoundError extends NotFoundError {
    readonly code = "RENTAL_NOT_FOUND";
    constructor();
}
export declare class InvalidRentalTransitionError extends BadRequestError {
    readonly code = "INVALID_RENTAL_TRANSITION";
    constructor();
}
export declare class RentalAccessDeniedError extends ForbiddenError {
    readonly code = "RENTAL_ACCESS_DENIED";
    constructor();
}
