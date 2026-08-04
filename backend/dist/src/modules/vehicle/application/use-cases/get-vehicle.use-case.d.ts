import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
export declare class GetVehicleUseCase {
    private readonly vehicleRepository;
    constructor(vehicleRepository: IVehicleRepository);
    execute(id: string): Promise<Result<Vehicle, AppError>>;
}
