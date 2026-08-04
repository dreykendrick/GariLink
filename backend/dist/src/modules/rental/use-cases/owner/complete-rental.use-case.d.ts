import { IRentalRequestRepository } from '../../domain/repositories/rental-request.repository.interface';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
export interface CompleteRentalCommand {
    userId: string;
    rentalId: string;
}
export declare class CompleteRentalUseCase {
    private repo;
    private prisma;
    constructor(repo: IRentalRequestRepository, prisma: PrismaService);
    execute(cmd: CompleteRentalCommand): Promise<Result<void, AppError>>;
}
