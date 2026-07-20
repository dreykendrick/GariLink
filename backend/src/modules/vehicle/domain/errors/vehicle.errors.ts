import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../../../../core/errors/app-error';

export class VehicleNotFoundError extends NotFoundError {
  override readonly code = 'VEHICLE_NOT_FOUND';
  constructor() { super('Vehicle not found'); }
}

export class VehicleVinAlreadyExistsError extends ConflictError {
  override readonly code = 'VEHICLE_VIN_EXISTS';
  constructor() { super('A vehicle with this VIN already exists'); }
}

export class VehicleAccessDeniedError extends ForbiddenError {
  override readonly code = 'VEHICLE_ACCESS_DENIED';
  constructor() { super('You do not have permission to manage this vehicle'); }
}

export class VehicleCannotBeListedError extends ForbiddenError {
  override readonly code = 'VEHICLE_CANNOT_BE_LISTED';
  constructor() {
    super('Vehicle cannot be listed in its current status (must be AVAILABLE)');
  }
}
