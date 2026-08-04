import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { UpdateVehicleDto } from '../dto/vehicle.dto';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { AuditLogService } from '../../../audit/audit-log.service';
export declare class UpdateVehicleUseCase {
    private readonly vehicleRepository;
    private readonly auditLog;
    constructor(vehicleRepository: IVehicleRepository, auditLog: AuditLogService);
    execute(id: string, dto: UpdateVehicleDto, userId: string): Promise<Result<Vehicle, AppError>>;
}
