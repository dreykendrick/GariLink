import { IVehicleAvailabilityRepository } from '../../domain/repositories/vehicle-availability.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleAvailabilityBlock } from '../../domain/entities/vehicle-availability-block.entity';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
export declare class GetVehicleAvailabilityUseCase {
    private readonly availabilityRepository;
    private readonly vehicleRepository;
    constructor(availabilityRepository: IVehicleAvailabilityRepository, vehicleRepository: IVehicleRepository);
    execute(vehicleId: string, userId: string): Promise<Result<VehicleAvailabilityBlock[], AppError>>;
}
