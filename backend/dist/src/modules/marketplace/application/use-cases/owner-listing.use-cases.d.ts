import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { Listing } from '../../domain/entities/listing.entity';
import { IListingRepository } from '../../domain/repositories/listing.repository.interface';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { AuditLogService } from '../../../audit/audit-log.service';
import { PaginatedResult } from '../../../../shared/application/paginated-result';
export declare class GetMyListingsUseCase {
    private readonly repository;
    private readonly prisma;
    constructor(repository: IListingRepository, prisma: PrismaService);
    execute(userId: string, params: any): Promise<Result<PaginatedResult<Listing & {
        vehicle?: unknown;
    }>, AppError>>;
}
export declare class PublishListingUseCase {
    private readonly repository;
    private readonly prisma;
    private readonly auditLog;
    constructor(repository: IListingRepository, prisma: PrismaService, auditLog: AuditLogService);
    execute(userId: string, listingId: string): Promise<Result<Listing, AppError>>;
}
export declare class PauseListingUseCase {
    private readonly repository;
    private readonly prisma;
    private readonly auditLog;
    constructor(repository: IListingRepository, prisma: PrismaService, auditLog: AuditLogService);
    execute(userId: string, listingId: string): Promise<Result<Listing, AppError>>;
}
export declare class ArchiveListingUseCase {
    private readonly repository;
    private readonly prisma;
    private readonly auditLog;
    constructor(repository: IListingRepository, prisma: PrismaService, auditLog: AuditLogService);
    execute(userId: string, listingId: string): Promise<Result<Listing, AppError>>;
}
export declare class RestoreListingUseCase {
    private readonly repository;
    private readonly prisma;
    private readonly auditLog;
    constructor(repository: IListingRepository, prisma: PrismaService, auditLog: AuditLogService);
    execute(userId: string, listingId: string): Promise<Result<Listing, AppError>>;
}
export declare class DeleteListingUseCase {
    private readonly repository;
    private readonly prisma;
    private readonly auditLog;
    constructor(repository: IListingRepository, prisma: PrismaService, auditLog: AuditLogService);
    execute(userId: string, listingId: string): Promise<Result<void, AppError>>;
}
export declare class UpdateListingUseCase {
    private readonly repository;
    private readonly prisma;
    private readonly auditLog;
    constructor(repository: IListingRepository, prisma: PrismaService, auditLog: AuditLogService);
    execute(userId: string, listingId: string, updateData: any): Promise<Result<Listing, AppError>>;
}
