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

class CreateListingDto {
  @IsString() @IsNotEmpty() vehicleId!: string;
  @IsString() @IsNotEmpty() workspaceId!: string;
  @IsEnum(ListingType) type!: ListingType;
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @IsPositive() askingPrice!: number;
  @IsOptional() @IsString() pricingCurrency?: string;
  @IsOptional() @IsBoolean() negotiable?: boolean;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number) conditionRating?: number;
  @IsOptional() @IsString() conditionNotes?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() county?: string;
}

class UpdateListingDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @IsPositive() askingPrice?: number;
  @IsOptional() @IsBoolean() negotiable?: boolean;
  @IsOptional() @IsNumber() conditionRating?: number;
  @IsOptional() @IsString() conditionNotes?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() county?: string;
}

class SearchListingsDto {
  @IsOptional() @Type(() => Number) @IsNumber() page?: number;
  @IsOptional() @Type(() => Number) @IsNumber() limit?: number;
  @IsOptional() @IsString() q?: string; // text search
  @IsOptional() @IsEnum(ListingType) type?: ListingType;
  @IsOptional() @IsString() make?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @Type(() => Number) @IsNumber() yearMin?: number;
  @IsOptional() @Type(() => Number) @IsNumber() yearMax?: number;
  @IsOptional() @Type(() => Number) @IsNumber() priceMin?: number;
  @IsOptional() @Type(() => Number) @IsNumber() priceMax?: number;
  @IsOptional() @IsString() fuelType?: string;
  @IsOptional() @IsString() transmissionType?: string;
  @IsOptional() @IsString() bodyType?: string;
  @IsOptional() @IsString() county?: string;
  @IsOptional() @IsBoolean() @Type(() => Boolean) negotiable?: boolean;
  @IsOptional() @IsString() sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'mileage';
}

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
      pricingCurrency: r.pricingCurrency,
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
    });
  }

  async createListing(input: CreateListingDto & { userId: string }): Promise<Result<Listing, AppError>> {
    try {
      // Verify vehicle exists and belongs to workspace
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: input.vehicleId },
      });
      if (!vehicle || vehicle.workspaceId !== input.workspaceId) {
        return Result.fail(new ListingAccessDeniedError());
      }
      if (vehicle.status !== VehicleStatus.AVAILABLE) {
        return Result.fail(new ForbiddenError('Vehicle must be AVAILABLE to be listed'));
      }

      const id = uuidv4();
      const record = await this.prisma.listing.create({
        data: {
          id,
          vehicleId: input.vehicleId,
          workspaceId: input.workspaceId,
          listerId: input.userId,
          type: input.type,
          title: input.title,
          description: input.description ?? null,
          pricingCurrency: input.pricingCurrency ?? 'KES',
          askingPrice: input.askingPrice,
          negotiable: input.negotiable ?? true,
          status: ListingStatus.DRAFT,
          conditionRating: input.conditionRating ?? null,
          conditionNotes: input.conditionNotes ?? null,
          tags: input.tags ?? [],
          county: input.county ?? null,
          country: 'KE',
        },
      });

      await this.auditLog.log({
        action: 'listing.created',
        actorId: input.userId,
        subjectType: 'Listing',
        subjectId: id,
        metadata: { vehicleId: input.vehicleId, type: input.type },
      });

      return Result.ok(this.toDomain(record));
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
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

  async updateListing(input: {
    listingId: string;
    userId: string;
    fields: Partial<ListingProps>;
  }): Promise<Result<Listing, AppError>> {
    try {
      const record = await this.prisma.listing.findUnique({ where: { id: input.listingId } });
      if (!record) return Result.fail(new ListingNotFoundError());
      if (record.listerId !== input.userId) return Result.fail(new ListingAccessDeniedError());

      const data: any = { ...input.fields, updatedAt: new Date() };
      Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

      const updated = await this.prisma.listing.update({
        where: { id: input.listingId },
        data,
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

  async search(query: SearchListingsDto): Promise<PaginatedResult<Listing & { vehicle?: unknown }>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, query.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.PUBLISHED,
    };

    if (query.type) where.type = query.type;
    if (query.county) where.county = query.county;
    if (query.negotiable !== undefined) where.negotiable = query.negotiable;

    if (query.priceMin || query.priceMax) {
      where.askingPrice = {};
      if (query.priceMin) (where.askingPrice as Record<string, number>).gte = query.priceMin;
      if (query.priceMax) (where.askingPrice as Record<string, number>).lte = query.priceMax;
    }

    if (query.make || query.model || query.yearMin || query.yearMax || query.fuelType || query.bodyType) {
      where.vehicle = {};
      if (query.make) (where.vehicle as Record<string, unknown>).make = { contains: query.make, mode: 'insensitive' };
      if (query.model) (where.vehicle as Record<string, unknown>).model = { contains: query.model, mode: 'insensitive' };
      if (query.fuelType) (where.vehicle as Record<string, unknown>).fuelType = query.fuelType;
      if (query.bodyType) (where.vehicle as Record<string, unknown>).bodyType = query.bodyType;
      if (query.yearMin || query.yearMax) {
        (where.vehicle as Record<string, unknown>).year = {};
        if (query.yearMin) ((where.vehicle as Record<string, unknown>).year as Record<string, number>).gte = query.yearMin;
        if (query.yearMax) ((where.vehicle as Record<string, unknown>).year as Record<string, number>).lte = query.yearMax;
      }
    }

    const orderBy: Prisma.ListingOrderByWithRelationInput[] = (() => {
      switch (query.sortBy) {
        case 'price_asc': return [{ askingPrice: 'asc' }];
        case 'price_desc': return [{ askingPrice: 'desc' }];
        case 'newest': return [{ publishedAt: 'desc' }];
        default: return [{ isFeatured: 'desc' }, { publishedAt: 'desc' }];
      }
    })();

    const [records, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          vehicle: {
            select: { make: true, model: true, year: true, mileage: true, fuelType: true, transmission: true, exteriorColor: true },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return PaginatedResult.of(records as any[], page, limit, total);
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
export class ListingController {
  constructor(private readonly service: MarketplaceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a listing (starts as DRAFT)' })
  async create(@Body() dto: CreateListingDto, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.service.createListing({ ...dto, userId: user.userId });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Get()
  @ApiOperation({ summary: 'Search public listings' })
  async search(@Query() query: SearchListingsDto) {
    return this.service.search(query);
  }

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

  @Patch(':id')
  @ApiOperation({ summary: 'Update listing details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
    @CurrentUser() user: AccessJwtPayload,
  ) {
    const result = await this.service.updateListing({
      listingId: id,
      userId: user.userId,
      fields: dto as Partial<ListingProps>,
    });
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

@Module({
  controllers: [ListingController, InquiryController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
