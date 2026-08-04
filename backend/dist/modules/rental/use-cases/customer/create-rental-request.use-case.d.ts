import { IRentalRequestRepository } from '../../domain/repositories/rental-request.repository.interface';
import { RentalRequest } from '../../domain/entities/rental-request.entity';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
export interface CreateRentalRequestCommand {
    customerId: string;
    workspaceId: string;
    vehicleId: string;
    listingId: string;
    startDate: Date;
    endDate: Date;
    dailyRate: number;
    totalAmount: number;
}
export declare class CreateRentalRequestUseCase {
    private repo;
    constructor(repo: IRentalRequestRepository);
    execute(cmd: CreateRentalRequestCommand): Promise<Result<RentalRequest, AppError>>;
}
