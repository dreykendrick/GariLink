"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaListingRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma.service");
const listing_mapper_1 = require("../persistence/listing.mapper");
const paginated_result_1 = require("../../../../shared/application/paginated-result");
let PrismaListingRepository = class PrismaListingRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async save(listing) {
        const data = listing_mapper_1.ListingMapper.toPersistence(listing);
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
                                create: rentalConfig.create,
                                update: rentalConfig.create,
                            }
                        }
                    } : {})
                },
            });
        }
        else {
            await this.prisma.listing.create({ data });
        }
    }
    async findById(id) {
        const record = await this.prisma.listing.findUnique({
            where: { id },
            include: {
                rentalConfig: true,
                vehicle: {
                    select: { make: true, model: true, year: true, mileage: true, fuelType: true, transmission: true, exteriorColor: true, primaryImageId: true },
                },
            },
        });
        if (!record)
            return null;
        const domain = listing_mapper_1.ListingMapper.toDomain(record);
        return Object.assign(domain, { vehicle: record.vehicle });
    }
    async search(params) {
        const page = Math.max(1, params.page ?? 1);
        const limit = Math.min(50, params.limit ?? 20);
        const skip = (page - 1) * limit;
        const where = {
            status: 'PUBLISHED',
        };
        if (params.type)
            where.type = params.type;
        if (params.county)
            where.county = params.county;
        if (params.negotiable !== undefined)
            where.negotiable = params.negotiable;
        if (params.priceMin || params.priceMax) {
            where.askingPrice = {};
            if (params.priceMin)
                where.askingPrice.gte = params.priceMin;
            if (params.priceMax)
                where.askingPrice.lte = params.priceMax;
        }
        if (params.type === 'FOR_HIRE' || params.city) {
            const rentalConfigWhere = { isNot: null };
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
            if (params.make)
                where.vehicle.make = { contains: params.make, mode: 'insensitive' };
            if (params.model)
                where.vehicle.model = { contains: params.model, mode: 'insensitive' };
            if (params.fuelType)
                where.vehicle.fuelType = params.fuelType;
            if (params.bodyType)
                where.vehicle.bodyType = params.bodyType;
            if (params.yearMin || params.yearMax) {
                where.vehicle.year = {};
                if (params.yearMin)
                    where.vehicle.year.gte = params.yearMin;
                if (params.yearMax)
                    where.vehicle.year.lte = params.yearMax;
            }
        }
        const orderBy = (() => {
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
            const domain = listing_mapper_1.ListingMapper.toDomain(r);
            return Object.assign(domain, { vehicle: r.vehicle });
        });
        return paginated_result_1.PaginatedResult.of(items, page, limit, total);
    }
    async delete(id) {
        await this.prisma.listing.delete({ where: { id } });
    }
    async softDelete(id) {
        await this.prisma.listing.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async findMyListings(workspaceId, params) {
        const page = Math.max(1, params.page ?? 1);
        const limit = Math.min(50, params.limit ?? 20);
        const skip = (page - 1) * limit;
        const where = {
            workspaceId,
            deletedAt: null,
        };
        if (params.status)
            where.status = params.status;
        if (params.type)
            where.type = params.type;
        const orderBy = [{ createdAt: 'desc' }];
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
            const domain = listing_mapper_1.ListingMapper.toDomain(r);
            return Object.assign(domain, { vehicle: r.vehicle });
        });
        return paginated_result_1.PaginatedResult.of(items, page, limit, total);
    }
    async findSavedListings(userId) {
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
            const domain = listing_mapper_1.ListingMapper.toDomain(r);
            return Object.assign(domain, { vehicle: r.vehicle });
        });
    }
    async toggleFavourite(userId, vehicleId, action) {
        if (action === 'save') {
            await this.prisma.savedVehicle.create({
                data: { userId, vehicleId },
            });
        }
        else {
            await this.prisma.savedVehicle.deleteMany({
                where: { userId, vehicleId },
            });
        }
    }
};
exports.PrismaListingRepository = PrismaListingRepository;
exports.PrismaListingRepository = PrismaListingRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaListingRepository);
//# sourceMappingURL=prisma-listing.repository.js.map