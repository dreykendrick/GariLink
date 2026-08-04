import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { PaginatedResult } from '../../../../shared/application/paginated-result';
import { VehicleQueryDto } from '../dto/vehicle.dto';
export declare class ListWorkspaceVehiclesUseCase {
    private readonly vehicleRepository;
    constructor(vehicleRepository: IVehicleRepository);
    execute(workspaceId: string, query: VehicleQueryDto): Promise<Result<PaginatedResult<Vehicle>, AppError>>;
}
