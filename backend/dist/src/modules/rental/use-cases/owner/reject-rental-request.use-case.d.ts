import { IRentalRequestRepository } from '../../domain/repositories/rental-request.repository.interface';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
export interface RejectRentalRequestCommand {
    userId: string;
    rentalId: string;
    reason?: string;
}
export declare class RejectRentalRequestUseCase {
    private repo;
    private prisma;
    constructor(repo: IRentalRequestRepository, prisma: PrismaService);
    execute(cmd: RejectRentalRequestCommand): Promise<Result<void, AppError>>;
}
