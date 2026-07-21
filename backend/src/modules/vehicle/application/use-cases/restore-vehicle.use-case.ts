import { Injectable, Inject } from '@nestjs/common';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { VehicleNotFoundError } from '../../domain/errors/vehicle.errors';
import { AuditLogService } from '../../../audit/audit-log.service';
import { VehicleStatus } from '@prisma/client';

@Injectable()
export class RestoreVehicleUseCase {
  constructor(
    @Inject('IVehicleRepository')
    private readonly vehicleRepository: IVehicleRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(id: string, userId: string): Promise<Result<void, AppError>> {
    try {
      const vehicle = await this.vehicleRepository.findById(id);
      if (!vehicle) {
        return Result.fail(new VehicleNotFoundError());
      }

      vehicle.updateStatus(VehicleStatus.AVAILABLE);
      await this.vehicleRepository.save(vehicle);

      await this.auditLog.log({
        action: 'vehicle.restored',
        actorId: userId,
        subjectType: 'Vehicle',
        subjectId: id,
      });

      return Result.ok(undefined);
    } catch (error: any) {
      if (error instanceof AppError) {
        return Result.fail(error);
      }
      throw error;
    }
  }
}
