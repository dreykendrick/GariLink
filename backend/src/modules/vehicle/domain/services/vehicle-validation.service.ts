import { VehicleStatus } from '@prisma/client';
import { ValidationError } from '../../../../core/errors/app-error';

export class VehicleValidationService {
  /**
   * Validates if the vehicle status transition is allowed according to domain rules.
   */
  static validateStatusTransition(currentStatus: VehicleStatus, newStatus: VehicleStatus): void {
    if (currentStatus === newStatus) {
      return;
    }

    if (currentStatus === VehicleStatus.RETIRED && newStatus !== VehicleStatus.RETIRED) {
      throw new ValidationError('Cannot change status of a retired vehicle');
    }

    if (currentStatus === VehicleStatus.ARCHIVED && newStatus === VehicleStatus.DRAFT) {
      throw new ValidationError('Cannot move an archived vehicle back to draft status');
    }
  }
}
