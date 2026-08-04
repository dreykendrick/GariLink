"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalAccessDeniedError = exports.InvalidRentalTransitionError = exports.RentalNotFoundError = void 0;
const app_error_1 = require("../../../../core/errors/app-error");
class RentalNotFoundError extends app_error_1.NotFoundError {
    constructor() {
        super('Rental request not found');
        this.code = 'RENTAL_NOT_FOUND';
    }
}
exports.RentalNotFoundError = RentalNotFoundError;
class InvalidRentalTransitionError extends app_error_1.BadRequestError {
    constructor() {
        super('Invalid rental status transition');
        this.code = 'INVALID_RENTAL_TRANSITION';
    }
}
exports.InvalidRentalTransitionError = InvalidRentalTransitionError;
class RentalAccessDeniedError extends app_error_1.ForbiddenError {
    constructor() {
        super('Access denied to rental request');
        this.code = 'RENTAL_ACCESS_DENIED';
    }
}
exports.RentalAccessDeniedError = RentalAccessDeniedError;
//# sourceMappingURL=rental.errors.js.map