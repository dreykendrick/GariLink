import { IRentalRequestRepository } from '../../domain/repositories/rental-request.repository.interface';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
export interface ApproveRentalRequestCommand {
    userId: string;
    rentalId: string;
}
export declare class ApproveRentalRequestUseCase {
    private repo;
    private prisma;
    constructor(repo: IRentalRequestRepository, prisma: PrismaService);
    execute(cmd: ApproveRentalRequestCommand): Promise<Result<void, AppError>>;
}
