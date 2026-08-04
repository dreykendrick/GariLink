import { NotFoundError, ConflictError, ForbiddenError } from '../../../../core/errors/app-error';
export declare class VehicleNotFoundError extends NotFoundError {
    readonly code = "VEHICLE_NOT_FOUND";
    constructor();
}
export declare class VehicleVinAlreadyExistsError extends ConflictError {
    readonly code = "VEHICLE_VIN_EXISTS";
    constructor();
}
export declare class VehicleAccessDeniedError extends ForbiddenError {
    readonly code = "VEHICLE_ACCESS_DENIED";
    constructor();
}
export declare class VehicleCannotBeListedError extends ForbiddenError {
    readonly code = "VEHICLE_CANNOT_BE_LISTED";
    constructor();
}
