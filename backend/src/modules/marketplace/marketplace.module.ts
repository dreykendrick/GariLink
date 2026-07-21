import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  Controller, Post, Get, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, Module,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean,
  IsArray, IsEnum, Min, IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ListingStatus, ListingType, InquiryStatus, VehicleStatus, Prisma,
} from '@prisma/client';

import { Result } from '../../shared/domain/result';
import { AppError, ForbiddenError, NotFoundError, ConflictError } from '../../core/errors/app-error';
import { PaginatedResult } from '../../shared/application/paginated-result';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CurrentUser } from '../../core/security/decorators/current-user.decorator';
import { AccessJwtPayload } from '../../core/security/token.service';
import { Listing, ListingProps } from './domain/entities/listing.entity';
import { Inquiry } from './domain/entities/inquiry.entity';

import { CreateListingUseCase } from './application/use-cases/create-listing.use-case';
import { SearchListingsUseCase } from './application/use-cases/search-listings.use-case';
import { GetListingUseCase } from './application/use-cases/get-listing.use-case';
import { GetSavedListingsUseCase } from './application/use-cases/get-saved-listings.use-case';
import { ToggleFavouriteUseCase } from './application/use-cases/toggle-favourite.use-case';
import { ListingController as NewListingController } from './presentation/controllers/listing.controller';
import { PrismaListingRepository } from './infrastructure/repositories/prisma-listing.repository';


// ─── Domain Errors ─────────────────────────────────────────────────────────

class ListingNotFoundError extends NotFoundError {
  readonly code: string = 'LISTING_NOT_FOUND';
  constructor() { super('Listing not found'); }
}
class ListingAccessDeniedError extends ForbiddenError {
  readonly code: string = 'LISTING_ACCESS_DENIED';
  constructor() { super('You do not have access to this listing'); }
}
class CannotInquireOwnListingError extends ForbiddenError {
  readonly code: string = 'CANNOT_INQUIRE_OWN';
  constructor() { super('You cannot inquire about your own listing'); }
}
class SavedListingAlreadyExistsError extends ConflictError {
  readonly code: string = 'ALREADY_SAVED';
  constructor() { super('Listing already saved'); }
}

// ─── DTOs ──────────────────────────────────────────────────────────────────

class CreateInquiryDto {
  @IsString() @IsNotEmpty() message!: string;
  @IsOptional() @IsNumber() @IsPositive() offeredPrice?: number;
  @IsOptional() @IsString() offerCurrency?: string;
}

class RespondInquiryDto {
  @IsEnum(['accept', 'decline', 'close']) decision!: 'accept' | 'decline' | 'close';
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class MarketplaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private toDomain(r: Prisma.ListingGetPayload<object>): Listing {
    return Listing.create(r.id, {
      vehicleId: r.vehicleId,
      workspaceId: r.workspaceId,
      listerId: r.listerId,
      type: r.type,
      title: r.title,
      description: r.description,
      currency: r.currency,
      askingPrice: r.askingPrice ? Number(r.askingPrice) : 0,
      negotiable: r.negotiable,
      status: r.status,
      publishedAt: r.publishedAt,
      expiresAt: r.expiresAt,
      viewCount: r.viewCount,
      saveCount: r.saveCount,
      contactCount: r.contactCount,
      isFeatured: r.isFeatured,
      featuredUntil: r.featuredUntil,
      conditionRating: r.conditionRating,
      conditionNotes: r.conditionNotes,
      tags: r.tags as string[],
      county: r.county,
      country: r.country,
      searchVector: null,
      deletedAt: null,
    });
  }


  async publishListing(listingId: string, userId: string): Promise<Result<Listing, AppError>> {
    try {
      const record = await this.prisma.listing.findUnique({ where: { id: listingId } });
      if (!record) return Result.fail(new ListingNotFoundError());
      if (record.listerId !== userId) return Result.fail(new ListingAccessDeniedError());

      const updated = await this.prisma.listing.update({
        where: { id: listingId },
        data: {
          status: ListingStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });

      await this.auditLog.log({
        action: 'listing.published',
        actorId: userId,
        subjectType: 'Listing',
        subjectId: listingId,
      });

      return Result.ok(this.toDomain(updated));
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }


  async updateStatus(input: {
    listingId: string;
    userId: string;
    status: ListingStatus;
  }): Promise<Result<Listing, AppError>> {
    try {
      const record = await this.prisma.listing.findUnique({ where: { id: input.listingId } });
      if (!record) return Result.fail(new ListingNotFoundError());
      if (record.listerId !== input.userId) return Result.fail(new ListingAccessDeniedError());

      const data: Prisma.ListingUpdateInput = { status: input.status };
      if (input.status === ListingStatus.PUBLISHED && !record.publishedAt) {
        data.publishedAt = new Date();
      }

      // If marking SOLD — update vehicle status too
      if (input.status === ListingStatus.SOLD) {
        await this.prisma.vehicle.update({
          where: { id: record.vehicleId },
          data: { status: VehicleStatus.UNAVAILABLE },
        });
      }

      const updated = await this.prisma.listing.update({ where: { id: input.listingId }, data });
      return Result.ok(this.toDomain(updated));
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }


  async getListing(listingId: string): Promise<Result<unknown, AppError>> {
    const record = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        vehicle: true,
      },
    });
    if (!record || record.status === ListingStatus.ARCHIVED) {
      return Result.fail(new ListingNotFoundError());
    }

    // Increment view count async
    void this.prisma.listing.update({
      where: { id: listingId },
      data: { viewCount: { increment: 1 } },
    });

    return Result.ok(record);
  }

  async createInquiry(input: {
    listingId: string;
    inquirerId: string;
    message: string;
    offeredPrice?: number;
    offerCurrency?: string;
  }): Promise<Result<Inquiry, AppError>> {
    try {
      const listing = await this.prisma.listing.findUnique({ where: { id: input.listingId } });
      if (!listing || listing.status !== ListingStatus.PUBLISHED) {
        return Result.fail(new ListingNotFoundError());
      }
      if (listing.listerId === input.inquirerId) {
        return Result.fail(new CannotInquireOwnListingError());
      }

      const id = uuidv4();
      const record = await this.prisma.inquiry.create({
        data: {
          id,
          listingId: input.listingId,
          inquirerId: input.inquirerId,
          status: InquiryStatus.PENDING,
          message: input.message,
          offeredPrice: input.offeredPrice ?? null,
          offerCurrency: input.offerCurrency ?? 'KES',
        },
      });

      // Increment contact count
      await this.prisma.listing.update({
        where: { id: input.listingId },
        data: { contactCount: { increment: 1 } },
      });

      return Result.ok(new Inquiry(
        record.id, record.listingId, record.inquirerId, record.status,
        record.message, record.offeredPrice ? Number(record.offeredPrice) : null, record.offerCurrency,
        record.respondedAt, record.respondedById, record.createdAt, record.updatedAt,
      ));
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }

  async respondToInquiry(input: {
    inquiryId: string;
    userId: string;
    decision: 'accept' | 'decline' | 'close';
  }): Promise<Result<Inquiry, AppError>> {
    try {
      const inquiry = await this.prisma.inquiry.findUnique({
        where: { id: input.inquiryId },
        include: { listing: { select: { listerId: true } } },
      });
      if (!inquiry) return Result.fail(new NotFoundError('Inquiry not found'));
      if (inquiry.listing.listerId !== input.userId) {
        return Result.fail(new ForbiddenError('Only the listing owner can respond'));
      }

      const statusMap: Record<string, InquiryStatus> = {
        accept: InquiryStatus.ACCEPTED,
        decline: InquiryStatus.DECLINED,
        close: InquiryStatus.CLOSED,
      };

      const record = await this.prisma.inquiry.update({
        where: { id: input.inquiryId },
        data: {
          status: statusMap[input.decision],
          respondedAt: new Date(),
          respondedById: input.userId,
        },
      });

      return Result.ok(new Inquiry(
        record.id, record.listingId, record.inquirerId, record.status,
        record.message, record.offeredPrice ? Number(record.offeredPrice) : null, record.offerCurrency,
        record.respondedAt, record.respondedById, record.createdAt, record.updatedAt,
      ));
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }

  async saveListing(listingId: string, userId: string): Promise<Result<void, AppError>> {
    try {
      const exists = await this.prisma.savedListing.findUnique({
        where: { userId_listingId: { userId, listingId } },
      });
      if (exists) return Result.fail(new SavedListingAlreadyExistsError());

      await this.prisma.savedListing.create({ data: { userId, listingId } });
      await this.prisma.listing.update({
        where: { id: listingId },
        data: { saveCount: { increment: 1 } },
      });
      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }

  async unsaveListing(listingId: string, userId: string): Promise<Result<void, AppError>> {
    await this.prisma.savedListing.deleteMany({ where: { userId, listingId } });
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { saveCount: { decrement: 1 } },
    });
    return Result.ok(undefined);
  }

  async getSavedListings(userId: string): Promise<unknown[]> {
    return this.prisma.savedListing.findMany({
      where: { userId },
      include: {
        listing: {
          include: { vehicle: { select: { make: true, model: true, year: true } } },
        },
      },
      orderBy: { savedAt: 'desc' },
    });
  }

  async getMyListings(userId: string): Promise<Listing[]> {
    const records = await this.prisma.listing.findMany({
      where: { listerId: userId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async deleteListing(listingId: string, userId: string): Promise<Result<void, AppError>> {
    try {
      const record = await this.prisma.listing.findUnique({ where: { id: listingId } });
      if (!record) return Result.fail(new ListingNotFoundError());
      if (record.listerId !== userId) return Result.fail(new ListingAccessDeniedError());

      await this.prisma.listing.update({
        where: { id: listingId },
        data: { status: ListingStatus.ARCHIVED },
      });
      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }
}

// ─── Controllers ──────────────────────────────────────────────────────────────

@ApiTags('Listings')
@ApiBearerAuth()
@Controller('listings')
export class LegacyListingController {
  constructor(private readonly service: MarketplaceService) {}



  @Get('mine')
  @ApiOperation({ summary: "Get current user's listings" })
  async mine(@CurrentUser() user: AccessJwtPayload) {
    return this.service.getMyListings(user.userId);
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get saved listings' })
  async saved(@CurrentUser() user: AccessJwtPayload) {
    return this.service.getSavedListings(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get listing details (increments view count)' })
  async get(@Param('id') id: string) {
    const result = await this.service.getListing(id);
    if (result.isFail) throw result.error;
    return result.value;
  }


  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish a DRAFT listing' })
  async publish(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.service.publishListing(id, user.userId);
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update listing status (pause/resume/mark sold)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ListingStatus },
    @CurrentUser() user: AccessJwtPayload,
  ) {
    const result = await this.service.updateStatus({
      listingId: id,
      userId: user.userId,
      status: body.status,
    });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive (soft delete) a listing' })
  async delete(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.service.deleteListing(id, user.userId);
    if (result.isFail) throw result.error;
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Save a listing to favourites' })
  async save(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.service.saveListing(id, user.userId);
    if (result.isFail) throw result.error;
    return { saved: true };
  }

  @Delete(':id/save')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove listing from favourites' })
  async unsave(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.service.unsaveListing(id, user.userId);
    if (result.isFail) throw result.error;
  }

  @Post(':id/inquiries')
  @ApiOperation({ summary: 'Send an inquiry to a listing seller' })
  async createInquiry(
    @Param('id') id: string,
    @Body() dto: CreateInquiryDto,
    @CurrentUser() user: AccessJwtPayload,
  ) {
    const result = await this.service.createInquiry({
      listingId: id,
      inquirerId: user.userId,
      ...dto,
    });
    if (result.isFail) throw result.error;
    return result.value;
  }
}

@ApiTags('Inquiries')
@ApiBearerAuth()
@Controller('inquiries')
export class InquiryController {
  constructor(private readonly service: MarketplaceService) {}

  @Post(':id/respond')
  @ApiOperation({ summary: 'Respond to an inquiry (accept/decline/close)' })
  async respond(
    @Param('id') id: string,
    @Body() dto: RespondInquiryDto,
    @CurrentUser() user: AccessJwtPayload,
  ) {
    const result = await this.service.respondToInquiry({
      inquiryId: id,
      userId: user.userId,
      decision: dto.decision,
    });
    if (result.isFail) throw result.error;
    return result.value;
  }
}

// ─── Module ───────────────────────────────────────────────────────────────────

import {
  GetMyListingsUseCase, PublishListingUseCase, PauseListingUseCase,
  ArchiveListingUseCase, RestoreListingUseCase, DeleteListingUseCase, UpdateListingUseCase
} from './application/use-cases/owner-listing.use-cases';

@Module({
  controllers: [NewListingController, LegacyListingController, InquiryController],
  providers: [
    MarketplaceService,
    CreateListingUseCase,
    SearchListingsUseCase,
    GetListingUseCase,
    GetSavedListingsUseCase,
    ToggleFavouriteUseCase,
    GetMyListingsUseCase,
    PublishListingUseCase,
    PauseListingUseCase,
    ArchiveListingUseCase,
    RestoreListingUseCase,
    DeleteListingUseCase,
    UpdateListingUseCase,
    { provide: 'IListingRepository', useClass: PrismaListingRepository },
  ],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
