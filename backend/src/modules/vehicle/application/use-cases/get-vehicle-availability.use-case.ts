import { Injectable, Inject } from '@nestjs/common';
import { IVehicleAvailabilityRepository } from '../../domain/repositories/vehicle-availability.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleAvailabilityBlock } from '../../domain/entities/vehicle-availability-block.entity';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { VehicleNotFoundError } from '../../domain/errors/vehicle.errors';

@Injectable()
export class GetVehicleAvailabilityUseCase {
  constructor(
    @Inject('IVehicleAvailabilityRepository')
    private readonly availabilityRepository: IVehicleAvailabilityRepository,
    @Inject('IVehicleRepository')
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(vehicleId: string, userId: string): Promise<Result<VehicleAvailabilityBlock[], AppError>> {
    try {
      const vehicle = await this.vehicleRepository.findById(vehicleId);
      if (!vehicle) {
        return Result.fail(new VehicleNotFoundError());
      }
      
      // Checking workspace ownership rights could be added here if needed
      
      const blocks = await this.availabilityRepository.findByVehicleId(vehicleId);
      return Result.ok(blocks);
    } catch (error: any) {
      if (error instanceof AppError) {
        return Result.fail(error);
      }
      throw error;
    }
  }
}
