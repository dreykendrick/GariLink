import { IRentalRequestRepository } from '../../domain/repositories/rental-request.repository.interface';
import { RentalRequest } from '../../domain/entities/rental-request.entity';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
export declare class GetMyRentalRequestsUseCase {
    private repo;
    constructor(repo: IRentalRequestRepository);
    execute(customerId: string): Promise<Result<RentalRequest[], AppError>>;
}
