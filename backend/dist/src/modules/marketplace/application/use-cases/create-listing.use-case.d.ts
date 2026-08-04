import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { CreateListingDto } from '../dto/listing.dto';
import { Listing } from '../../domain/entities/listing.entity';
import { IListingRepository } from '../../domain/repositories/listing.repository.interface';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { AuditLogService } from '../../../audit/audit-log.service';
export declare class CreateListingUseCase {
    private readonly repository;
    private readonly prisma;
    private readonly auditLog;
    constructor(repository: IListingRepository, prisma: PrismaService, auditLog: AuditLogService);
    execute(input: CreateListingDto & {
        userId: string;
    }): Promise<Result<Listing, AppError>>;
}
