import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IListingRepository, ListingSearchParams } from '../../domain/repositories/listing.repository.interface';
import { Listing } from '../../domain/entities/listing.entity';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { ListingMapper } from '../persistence/listing.mapper';
import { PaginatedResult } from '../../../../shared/application/paginated-result';

@Injectable()
export class PrismaListingRepository implements IListingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(listing: Listing): Promise<void> {
    const data = ListingMapper.toPersistence(listing);
    
    const exists = await this.prisma.listing.findUnique({ where: { id: listing.id } });
    if (exists) {
      const { rentalConfig, ...rest } = data;
      await this.prisma.listing.update({
        where: { id: listing.id },
        data: {
          ...rest,
          ...(rentalConfig ? {
            rentalConfig: {
              upsert: {
                create: rentalConfig.create!,
                update: rentalConfig.create!,
              }
            }
          } : {})
        } as any,
      });
    } else {
      await this.prisma.listing.create({ data });
    }
  }

  async findById(id: string): Promise<Listing | null> {
    const record = await this.prisma.listing.findUnique({
      where: { id },
      include: { 
        rentalConfig: true,
        vehicle: {
          select: { make: true, model: true, year: true, mileage: true, fuelType: true, transmission: true, exteriorColor: true, primaryImageId: true },
        },
      },
    });
    if (!record) return null;
    const domain = ListingMapper.toDomain(record as any);
    return Object.assign(domain, { vehicle: (record as any).vehicle });
  }

  async search(params: ListingSearchParams): Promise<PaginatedResult<Listing & { vehicle?: unknown }>> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(50, params.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      status: 'PUBLISHED',
    };

    if (params.type) where.type = params.type;
    if (params.county) where.county = params.county;
    if (params.negotiable !== undefined) where.negotiable = params.negotiable;

    if (params.priceMin || params.priceMax) {
      where.askingPrice = {};
      if (params.priceMin) (where.askingPrice as Record<string, number>).gte = params.priceMin;
      if (params.priceMax) (where.askingPrice as Record<string, number>).lte = params.priceMax;
    }
    
    // Handle nested rentalConfig search
    if (params.type === 'FOR_HIRE' || params.city) {
      const rentalConfigWhere: any = { isNot: null };
      if (params.city) {
        rentalConfigWhere.pickupCity = params.city;
      }
      if (params.county && !where.county) {
        rentalConfigWhere.pickupCounty = params.county;
      }
      where.rentalConfig = rentalConfigWhere;
    }

    if (params.make || params.model || params.yearMin || params.yearMax || params.fuelType || params.bodyType) {
      where.vehicle = {};
      if (params.make) (where.vehicle as Record<string, unknown>).make = { contains: params.make, mode: 'insensitive' };
      if (params.model) (where.vehicle as Record<string, unknown>).model = { contains: params.model, mode: 'insensitive' };
      if (params.fuelType) (where.vehicle as Record<string, unknown>).fuelType = params.fuelType;
      if (params.bodyType) (where.vehicle as Record<string, unknown>).bodyType = params.bodyType;
      if (params.yearMin || params.yearMax) {
        (where.vehicle as Record<string, unknown>).year = {};
        if (params.yearMin) ((where.vehicle as Record<string, unknown>).year as Record<string, number>).gte = params.yearMin;
        if (params.yearMax) ((where.vehicle as Record<string, unknown>).year as Record<string, number>).lte = params.yearMax;
      }
    }

    const orderBy: Prisma.ListingOrderByWithRelationInput[] = (() => {
      switch (params.sortBy) {
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
          rentalConfig: true,
          vehicle: {
            select: { make: true, model: true, year: true, mileage: true, fuelType: true, transmission: true, exteriorColor: true, primaryImageId: true },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    const items = records.map(r => {
      const domain = ListingMapper.toDomain(r as any);
      return Object.assign(domain, { vehicle: r.vehicle });
    });

    return PaginatedResult.of(items, page, limit, total);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.listing.delete({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.listing.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findMyListings(workspaceId: string, params: any): Promise<PaginatedResult<Listing & { vehicle?: unknown }>> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(50, params.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      workspaceId,
      deletedAt: null,
    };

    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;

    const orderBy: Prisma.ListingOrderByWithRelationInput[] = [{ createdAt: 'desc' }];

    const [records, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          rentalConfig: true,
          vehicle: {
            select: { make: true, model: true, year: true, mileage: true, fuelType: true, transmission: true, exteriorColor: true, primaryImageId: true },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    const items = records.map(r => {
      const domain = ListingMapper.toDomain(r as any);
      return Object.assign(domain, { vehicle: r.vehicle });
    });

    return PaginatedResult.of(items, page, limit, total);
  }

  async findSavedListings(userId: string): Promise<(Listing & { vehicle?: unknown })[]> {
    const records = await this.prisma.listing.findMany({
      where: { vehicle: { savedBy: { some: { userId } } } },
      include: {
        rentalConfig: true,
        vehicle: {
          select: { make: true, model: true, year: true, mileage: true, fuelType: true, transmission: true, exteriorColor: true, primaryImageId: true },
        },
      },
    });

    return records.map(r => {
      const domain = ListingMapper.toDomain(r as any);
      return Object.assign(domain, { vehicle: r.vehicle });
    });
  }

  async toggleFavourite(userId: string, vehicleId: string, action: 'save' | 'remove'): Promise<void> {
    if (action === 'save') {
      await this.prisma.savedVehicle.create({
        data: { userId, vehicleId },
      });
    } else {
      await this.prisma.savedVehicle.deleteMany({
        where: { userId, vehicleId },
      });
    }
  }
}
