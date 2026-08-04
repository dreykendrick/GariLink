import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { AuditLogService } from '../../../audit/audit-log.service';
export declare class RestoreVehicleUseCase {
    private readonly vehicleRepository;
    private readonly auditLog;
    constructor(vehicleRepository: IVehicleRepository, auditLog: AuditLogService);
    execute(id: string, userId: string): Promise<Result<void, AppError>>;
}
