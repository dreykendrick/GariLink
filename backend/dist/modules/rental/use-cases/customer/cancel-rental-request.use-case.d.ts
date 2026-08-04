import { IRentalRequestRepository } from '../../domain/repositories/rental-request.repository.interface';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
export interface CancelRentalRequestCommand {
    customerId: string;
    rentalId: string;
}
export declare class CancelRentalRequestUseCase {
    private repo;
    constructor(repo: IRentalRequestRepository);
    execute(cmd: CancelRentalRequestCommand): Promise<Result<void, AppError>>;
}
