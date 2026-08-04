import { IVehicleAvailabilityRepository } from '../../domain/repositories/vehicle-availability.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleAvailabilityBlock } from '../../domain/entities/vehicle-availability-block.entity';
import { BlockVehicleDatesDto } from '../dto/vehicle-availability.dto';
import { Result } from '../../../../shared/domain/result';
import { AppError, ConflictError } from '../../../../core/errors/app-error';
export declare class OverlappingBlockError extends ConflictError {
    readonly code = "OVERLAPPING_BLOCK";
    constructor();
}
export declare class BlockVehicleDatesUseCase {
    private readonly availabilityRepository;
    private readonly vehicleRepository;
    constructor(availabilityRepository: IVehicleAvailabilityRepository, vehicleRepository: IVehicleRepository);
    execute(vehicleId: string, dto: BlockVehicleDatesDto, userId: string): Promise<Result<VehicleAvailabilityBlock, AppError>>;
}
