import { Injectable, Inject } from '@nestjs/common';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { VehicleNotFoundError } from '../../domain/errors/vehicle.errors';

@Injectable()
export class GetVehicleUseCase {
  constructor(
    @Inject('IVehicleRepository')
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(id: string): Promise<Result<Vehicle, AppError>> {
    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      return Result.fail(new VehicleNotFoundError());
    }
    return Result.ok(vehicle);
  }
}
