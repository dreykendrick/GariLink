import { BadRequestError, NotFoundError, ForbiddenError } from '../../../../core/errors/app-error';

export class RentalNotFoundError extends NotFoundError {
  readonly code = 'RENTAL_NOT_FOUND';
  constructor() { super('Rental request not found'); }
}

export class InvalidRentalTransitionError extends BadRequestError {
  readonly code = 'INVALID_RENTAL_TRANSITION';
  constructor() { super('Invalid rental status transition'); }
}

export class RentalAccessDeniedError extends ForbiddenError {
  readonly code = 'RENTAL_ACCESS_DENIED';
  constructor() { super('Access denied to rental request'); }
}