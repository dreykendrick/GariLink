import { IRentalRequestRepository } from '../../domain/repositories/rental-request.repository.interface';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { RentalRequest } from '../../domain/entities/rental-request.entity';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
export declare class GetWorkspaceRentalRequestsUseCase {
    private repo;
    private prisma;
    constructor(repo: IRentalRequestRepository, prisma: PrismaService);
    execute(userId: string, workspaceId: string): Promise<Result<RentalRequest[], AppError>>;
}
