"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleCannotBeListedError = exports.VehicleAccessDeniedError = exports.VehicleVinAlreadyExistsError = exports.VehicleNotFoundError = void 0;
const app_error_1 = require("../../../../core/errors/app-error");
class VehicleNotFoundError extends app_error_1.NotFoundError {
    constructor() {
        super('Vehicle not found');
        this.code = 'VEHICLE_NOT_FOUND';
    }
}
exports.VehicleNotFoundError = VehicleNotFoundError;
class VehicleVinAlreadyExistsError extends app_error_1.ConflictError {
    constructor() {
        super('A vehicle with this VIN already exists');
        this.code = 'VEHICLE_VIN_EXISTS';
    }
}
exports.VehicleVinAlreadyExistsError = VehicleVinAlreadyExistsError;
class VehicleAccessDeniedError extends app_error_1.ForbiddenError {
    constructor() {
        super('You do not have permission to manage this vehicle');
        this.code = 'VEHICLE_ACCESS_DENIED';
    }
}
exports.VehicleAccessDeniedError = VehicleAccessDeniedError;
class VehicleCannotBeListedError extends app_error_1.ForbiddenError {
    constructor() {
        super('Vehicle cannot be listed in its current status (must be AVAILABLE)');
        this.code = 'VEHICLE_CANNOT_BE_LISTED';
    }
}
exports.VehicleCannotBeListedError = VehicleCannotBeListedError;
//# sourceMappingURL=vehicle.errors.js.map