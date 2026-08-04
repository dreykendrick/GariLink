import { IRentalRequestRepository } from '../../domain/repositories/rental-request.repository.interface';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
export interface StartRentalCommand {
    userId: string;
    rentalId: string;
}
export declare class StartRentalUseCase {
    private repo;
    private prisma;
    constructor(repo: IRentalRequestRepository, prisma: PrismaService);
    execute(cmd: StartRentalCommand): Promise<Result<void, AppError>>;
}
