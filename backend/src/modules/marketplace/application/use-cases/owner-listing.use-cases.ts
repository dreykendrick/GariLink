import { Injectable, Inject } from '@nestjs/common';
import { Result } from '../../../../shared/domain/result';
import { AppError, ForbiddenError, NotFoundError, ConflictError } from '../../../../core/errors/app-error';
import { Listing } from '../../domain/entities/listing.entity';
import { IListingRepository } from '../../domain/repositories/listing.repository.interface';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { AuditLogService } from '../../../audit/audit-log.service';
import { PaginatedResult } from '../../../../shared/application/paginated-result';

class ListingAccessDeniedError extends ForbiddenError {
  readonly code = 'LISTING_ACCESS_DENIED';
  constructor() { super('You do not have access to this listing'); }
}

@Injectable()
export class GetMyListingsUseCase {
  constructor(
    @Inject('IListingRepository') private readonly repository: IListingRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, params: any): Promise<Result<PaginatedResult<Listing & { vehicle?: unknown }>, AppError>> {
    try {
      const workspace = await this.prisma.workspace.findFirst({
        where: { ownerId: userId },
      });
      if (!workspace) {
        return Result.fail(new NotFoundError('Workspace not found for user'));
      }
      const listings = await this.repository.findMyListings(workspace.id, params);
      return Result.ok(listings);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      return Result.fail(new ConflictError((error as Error).message));
    }
  }
}

@Injectable()
export class PublishListingUseCase {
  constructor(
    @Inject('IListingRepository') private readonly repository: IListingRepository,
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(userId: string, listingId: string): Promise<Result<Listing, AppError>> {
    try {
      const listing = await this.repository.findById(listingId);
      if (!listing) return Result.fail(new NotFoundError('Listing not found'));

      const workspace = await this.prisma.workspace.findFirst({
        where: { id: listing.workspaceId, ownerId: userId },
      });
      if (!workspace) return Result.fail(new ListingAccessDeniedError());

      listing.publish();
      await this.repository.save(listing);

      await this.auditLog.log({
        action: 'listing.published',
        actorId: userId,
        subjectType: 'Listing',
        subjectId: listing.id,
      });

      return Result.ok(listing);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      return Result.fail(new ConflictError((error as Error).message));
    }
  }
}

@Injectable()
export class PauseListingUseCase {
  constructor(
    @Inject('IListingRepository') private readonly repository: IListingRepository,
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(userId: string, listingId: string): Promise<Result<Listing, AppError>> {
    try {
      const listing = await this.repository.findById(listingId);
      if (!listing) return Result.fail(new NotFoundError('Listing not found'));

      const workspace = await this.prisma.workspace.findFirst({
        where: { id: listing.workspaceId, ownerId: userId },
      });
      if (!workspace) return Result.fail(new ListingAccessDeniedError());

      listing.pause();
      await this.repository.save(listing);

      await this.auditLog.log({
        action: 'listing.paused',
        actorId: userId,
        subjectType: 'Listing',
        subjectId: listing.id,
      });

      return Result.ok(listing);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      return Result.fail(new ConflictError((error as Error).message));
    }
  }
}

@Injectable()
export class ArchiveListingUseCase {
  constructor(
    @Inject('IListingRepository') private readonly repository: IListingRepository,
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(userId: string, listingId: string): Promise<Result<Listing, AppError>> {
    try {
      const listing = await this.repository.findById(listingId);
      if (!listing) return Result.fail(new NotFoundError('Listing not found'));

      const workspace = await this.prisma.workspace.findFirst({
        where: { id: listing.workspaceId, ownerId: userId },
      });
      if (!workspace) return Result.fail(new ListingAccessDeniedError());

      listing.archive();
      await this.repository.save(listing);

      await this.auditLog.log({
        action: 'listing.archived',
        actorId: userId,
        subjectType: 'Listing',
        subjectId: listing.id,
      });

      return Result.ok(listing);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      return Result.fail(new ConflictError((error as Error).message));
    }
  }
}

@Injectable()
export class RestoreListingUseCase {
  constructor(
    @Inject('IListingRepository') private readonly repository: IListingRepository,
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(userId: string, listingId: string): Promise<Result<Listing, AppError>> {
    try {
      const listing = await this.repository.findById(listingId);
      if (!listing) return Result.fail(new NotFoundError('Listing not found'));

      const workspace = await this.prisma.workspace.findFirst({
        where: { id: listing.workspaceId, ownerId: userId },
      });
      if (!workspace) return Result.fail(new ListingAccessDeniedError());

      listing.restore();
      await this.repository.save(listing);

      await this.auditLog.log({
        action: 'listing.restored',
        actorId: userId,
        subjectType: 'Listing',
        subjectId: listing.id,
      });

      return Result.ok(listing);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      return Result.fail(new ConflictError((error as Error).message));
    }
  }
}

@Injectable()
export class DeleteListingUseCase {
  constructor(
    @Inject('IListingRepository') private readonly repository: IListingRepository,
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(userId: string, listingId: string): Promise<Result<void, AppError>> {
    try {
      const listing = await this.repository.findById(listingId);
      if (!listing) return Result.fail(new NotFoundError('Listing not found'));

      const workspace = await this.prisma.workspace.findFirst({
        where: { id: listing.workspaceId, ownerId: userId },
      });
      if (!workspace) return Result.fail(new ListingAccessDeniedError());

      listing.softDelete();
      await this.repository.save(listing);
      await this.repository.softDelete(listingId);

      await this.auditLog.log({
        action: 'listing.deleted',
        actorId: userId,
        subjectType: 'Listing',
        subjectId: listing.id,
      });

      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      return Result.fail(new ConflictError((error as Error).message));
    }
  }
}

@Injectable()
export class UpdateListingUseCase {
  constructor(
    @Inject('IListingRepository') private readonly repository: IListingRepository,
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(userId: string, listingId: string, updateData: any): Promise<Result<Listing, AppError>> {
    try {
      const listing = await this.repository.findById(listingId);
      if (!listing) return Result.fail(new NotFoundError('Listing not found'));

      const workspace = await this.prisma.workspace.findFirst({
        where: { id: listing.workspaceId, ownerId: userId },
      });
      if (!workspace) return Result.fail(new ListingAccessDeniedError());

      // Omit restricted fields from update
      const { vehicleId, workspaceId, listerId, status, id, ...safeUpdateData } = updateData;
      listing.update(safeUpdateData);
      await this.repository.save(listing);

      await this.auditLog.log({
        action: 'listing.updated',
        actorId: userId,
        subjectType: 'Listing',
        subjectId: listing.id,
      });

      return Result.ok(listing);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      return Result.fail(new ConflictError((error as Error).message));
    }
  }
}
