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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceModule = exports.InquiryController = exports.LegacyListingController = exports.MarketplaceService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const common_2 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const result_1 = require("../../shared/domain/result");
const app_error_1 = require("../../core/errors/app-error");
const prisma_service_1 = require("../../shared/infrastructure/prisma.service");
const audit_log_service_1 = require("../audit/audit-log.service");
const current_user_decorator_1 = require("../../core/security/decorators/current-user.decorator");
const listing_entity_1 = require("./domain/entities/listing.entity");
const inquiry_entity_1 = require("./domain/entities/inquiry.entity");
const create_listing_use_case_1 = require("./application/use-cases/create-listing.use-case");
const search_listings_use_case_1 = require("./application/use-cases/search-listings.use-case");
const get_listing_use_case_1 = require("./application/use-cases/get-listing.use-case");
const get_saved_listings_use_case_1 = require("./application/use-cases/get-saved-listings.use-case");
const toggle_favourite_use_case_1 = require("./application/use-cases/toggle-favourite.use-case");
const listing_controller_1 = require("./presentation/controllers/listing.controller");
const prisma_listing_repository_1 = require("./infrastructure/repositories/prisma-listing.repository");
class ListingNotFoundError extends app_error_1.NotFoundError {
    constructor() {
        super('Listing not found');
        this.code = 'LISTING_NOT_FOUND';
    }
}
class ListingAccessDeniedError extends app_error_1.ForbiddenError {
    constructor() {
        super('You do not have access to this listing');
        this.code = 'LISTING_ACCESS_DENIED';
    }
}
class CannotInquireOwnListingError extends app_error_1.ForbiddenError {
    constructor() {
        super('You cannot inquire about your own listing');
        this.code = 'CANNOT_INQUIRE_OWN';
    }
}
class SavedListingAlreadyExistsError extends app_error_1.ConflictError {
    constructor() {
        super('Listing already saved');
        this.code = 'ALREADY_SAVED';
    }
}
class CreateInquiryDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateInquiryDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateInquiryDto.prototype, "offeredPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInquiryDto.prototype, "offerCurrency", void 0);
class RespondInquiryDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(['accept', 'decline', 'close']),
    __metadata("design:type", String)
], RespondInquiryDto.prototype, "decision", void 0);
let MarketplaceService = class MarketplaceService {
    constructor(prisma, auditLog) {
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    toDomain(r) {
        return listing_entity_1.Listing.create(r.id, {
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
            tags: r.tags,
            county: r.county,
            country: r.country,
            searchVector: null,
            deletedAt: null,
        });
    }
    async publishListing(listingId, userId) {
        try {
            const record = await this.prisma.listing.findUnique({ where: { id: listingId } });
            if (!record)
                return result_1.Result.fail(new ListingNotFoundError());
            if (record.listerId !== userId)
                return result_1.Result.fail(new ListingAccessDeniedError());
            const updated = await this.prisma.listing.update({
                where: { id: listingId },
                data: {
                    status: client_1.ListingStatus.PUBLISHED,
                    publishedAt: new Date(),
                },
            });
            await this.auditLog.log({
                action: 'listing.published',
                actorId: userId,
                subjectType: 'Listing',
                subjectId: listingId,
            });
            return result_1.Result.ok(this.toDomain(updated));
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
    async updateStatus(input) {
        try {
            const record = await this.prisma.listing.findUnique({ where: { id: input.listingId } });
            if (!record)
                return result_1.Result.fail(new ListingNotFoundError());
            if (record.listerId !== input.userId)
                return result_1.Result.fail(new ListingAccessDeniedError());
            const data = { status: input.status };
            if (input.status === client_1.ListingStatus.PUBLISHED && !record.publishedAt) {
                data.publishedAt = new Date();
            }
            if (input.status === client_1.ListingStatus.SOLD) {
                await this.prisma.vehicle.update({
                    where: { id: record.vehicleId },
                    data: { status: client_1.VehicleStatus.UNAVAILABLE },
                });
            }
            const updated = await this.prisma.listing.update({ where: { id: input.listingId }, data });
            return result_1.Result.ok(this.toDomain(updated));
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
    async getListing(listingId) {
        const record = await this.prisma.listing.findUnique({
            where: { id: listingId },
            include: {
                vehicle: true,
            },
        });
        if (!record || record.status === client_1.ListingStatus.ARCHIVED) {
            return result_1.Result.fail(new ListingNotFoundError());
        }
        void this.prisma.listing.update({
            where: { id: listingId },
            data: { viewCount: { increment: 1 } },
        });
        return result_1.Result.ok(record);
    }
    async createInquiry(input) {
        try {
            const listing = await this.prisma.listing.findUnique({ where: { id: input.listingId } });
            if (!listing || listing.status !== client_1.ListingStatus.PUBLISHED) {
                return result_1.Result.fail(new ListingNotFoundError());
            }
            if (listing.listerId === input.inquirerId) {
                return result_1.Result.fail(new CannotInquireOwnListingError());
            }
            const id = (0, uuid_1.v4)();
            const record = await this.prisma.inquiry.create({
                data: {
                    id,
                    listingId: input.listingId,
                    inquirerId: input.inquirerId,
                    status: client_1.InquiryStatus.PENDING,
                    message: input.message,
                    offeredPrice: input.offeredPrice ?? null,
                    offerCurrency: input.offerCurrency ?? 'KES',
                },
            });
            await this.prisma.listing.update({
                where: { id: input.listingId },
                data: { contactCount: { increment: 1 } },
            });
            return result_1.Result.ok(new inquiry_entity_1.Inquiry(record.id, record.listingId, record.inquirerId, record.status, record.message, record.offeredPrice ? Number(record.offeredPrice) : null, record.offerCurrency, record.respondedAt, record.respondedById, record.createdAt, record.updatedAt));
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
    async respondToInquiry(input) {
        try {
            const inquiry = await this.prisma.inquiry.findUnique({
                where: { id: input.inquiryId },
                include: { listing: { select: { listerId: true } } },
            });
            if (!inquiry)
                return result_1.Result.fail(new app_error_1.NotFoundError('Inquiry not found'));
            if (inquiry.listing.listerId !== input.userId) {
                return result_1.Result.fail(new app_error_1.ForbiddenError('Only the listing owner can respond'));
            }
            const statusMap = {
                accept: client_1.InquiryStatus.ACCEPTED,
                decline: client_1.InquiryStatus.DECLINED,
                close: client_1.InquiryStatus.CLOSED,
            };
            const record = await this.prisma.inquiry.update({
                where: { id: input.inquiryId },
                data: {
                    status: statusMap[input.decision],
                    respondedAt: new Date(),
                    respondedById: input.userId,
                },
            });
            return result_1.Result.ok(new inquiry_entity_1.Inquiry(record.id, record.listingId, record.inquirerId, record.status, record.message, record.offeredPrice ? Number(record.offeredPrice) : null, record.offerCurrency, record.respondedAt, record.respondedById, record.createdAt, record.updatedAt));
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
    async saveListing(listingId, userId) {
        try {
            const exists = await this.prisma.savedListing.findUnique({
                where: { userId_listingId: { userId, listingId } },
            });
            if (exists)
                return result_1.Result.fail(new SavedListingAlreadyExistsError());
            await this.prisma.savedListing.create({ data: { userId, listingId } });
            await this.prisma.listing.update({
                where: { id: listingId },
                data: { saveCount: { increment: 1 } },
            });
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
    async unsaveListing(listingId, userId) {
        await this.prisma.savedListing.deleteMany({ where: { userId, listingId } });
        await this.prisma.listing.update({
            where: { id: listingId },
            data: { saveCount: { decrement: 1 } },
        });
        return result_1.Result.ok(undefined);
    }
    async getSavedListings(userId) {
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
    async getMyListings(userId) {
        const records = await this.prisma.listing.findMany({
            where: { listerId: userId },
            orderBy: { createdAt: 'desc' },
        });
        return records.map((r) => this.toDomain(r));
    }
    async deleteListing(listingId, userId) {
        try {
            const record = await this.prisma.listing.findUnique({ where: { id: listingId } });
            if (!record)
                return result_1.Result.fail(new ListingNotFoundError());
            if (record.listerId !== userId)
                return result_1.Result.fail(new ListingAccessDeniedError());
            await this.prisma.listing.update({
                where: { id: listingId },
                data: { status: client_1.ListingStatus.ARCHIVED },
            });
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
};
exports.MarketplaceService = MarketplaceService;
exports.MarketplaceService = MarketplaceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], MarketplaceService);
let LegacyListingController = class LegacyListingController {
    constructor(service) {
        this.service = service;
    }
    async mine(user) {
        return this.service.getMyListings(user.userId);
    }
    async saved(user) {
        return this.service.getSavedListings(user.userId);
    }
    async get(id) {
        const result = await this.service.getListing(id);
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async publish(id, user) {
        const result = await this.service.publishListing(id, user.userId);
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async updateStatus(id, body, user) {
        const result = await this.service.updateStatus({
            listingId: id,
            userId: user.userId,
            status: body.status,
        });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async delete(id, user) {
        const result = await this.service.deleteListing(id, user.userId);
        if (result.isFail)
            throw result.error;
    }
    async save(id, user) {
        const result = await this.service.saveListing(id, user.userId);
        if (result.isFail)
            throw result.error;
        return { saved: true };
    }
    async unsave(id, user) {
        const result = await this.service.unsaveListing(id, user.userId);
        if (result.isFail)
            throw result.error;
    }
    async createInquiry(id, dto, user) {
        const result = await this.service.createInquiry({
            listingId: id,
            inquirerId: user.userId,
            ...dto,
        });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
};
exports.LegacyListingController = LegacyListingController;
__decorate([
    (0, common_2.Get)('mine'),
    (0, swagger_1.ApiOperation)({ summary: "Get current user's listings" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LegacyListingController.prototype, "mine", null);
__decorate([
    (0, common_2.Get)('saved'),
    (0, swagger_1.ApiOperation)({ summary: 'Get saved listings' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LegacyListingController.prototype, "saved", null);
__decorate([
    (0, common_2.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get listing details (increments view count)' }),
    __param(0, (0, common_2.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LegacyListingController.prototype, "get", null);
__decorate([
    (0, common_2.Post)(':id/publish'),
    (0, swagger_1.ApiOperation)({ summary: 'Publish a DRAFT listing' }),
    __param(0, (0, common_2.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LegacyListingController.prototype, "publish", null);
__decorate([
    (0, common_2.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update listing status (pause/resume/mark sold)' }),
    __param(0, (0, common_2.Param)('id')),
    __param(1, (0, common_2.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LegacyListingController.prototype, "updateStatus", null);
__decorate([
    (0, common_2.Delete)(':id'),
    (0, common_2.HttpCode)(common_2.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Archive (soft delete) a listing' }),
    __param(0, (0, common_2.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LegacyListingController.prototype, "delete", null);
__decorate([
    (0, common_2.Post)(':id/save'),
    (0, swagger_1.ApiOperation)({ summary: 'Save a listing to favourites' }),
    __param(0, (0, common_2.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LegacyListingController.prototype, "save", null);
__decorate([
    (0, common_2.Delete)(':id/save'),
    (0, common_2.HttpCode)(common_2.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove listing from favourites' }),
    __param(0, (0, common_2.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LegacyListingController.prototype, "unsave", null);
__decorate([
    (0, common_2.Post)(':id/inquiries'),
    (0, swagger_1.ApiOperation)({ summary: 'Send an inquiry to a listing seller' }),
    __param(0, (0, common_2.Param)('id')),
    __param(1, (0, common_2.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateInquiryDto, Object]),
    __metadata("design:returntype", Promise)
], LegacyListingController.prototype, "createInquiry", null);
exports.LegacyListingController = LegacyListingController = __decorate([
    (0, swagger_1.ApiTags)('Listings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_2.Controller)('listings'),
    __metadata("design:paramtypes", [MarketplaceService])
], LegacyListingController);
let InquiryController = class InquiryController {
    constructor(service) {
        this.service = service;
    }
    async respond(id, dto, user) {
        const result = await this.service.respondToInquiry({
            inquiryId: id,
            userId: user.userId,
            decision: dto.decision,
        });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
};
exports.InquiryController = InquiryController;
__decorate([
    (0, common_2.Post)(':id/respond'),
    (0, swagger_1.ApiOperation)({ summary: 'Respond to an inquiry (accept/decline/close)' }),
    __param(0, (0, common_2.Param)('id')),
    __param(1, (0, common_2.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RespondInquiryDto, Object]),
    __metadata("design:returntype", Promise)
], InquiryController.prototype, "respond", null);
exports.InquiryController = InquiryController = __decorate([
    (0, swagger_1.ApiTags)('Inquiries'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_2.Controller)('inquiries'),
    __metadata("design:paramtypes", [MarketplaceService])
], InquiryController);
const owner_listing_use_cases_1 = require("./application/use-cases/owner-listing.use-cases");
let MarketplaceModule = class MarketplaceModule {
};
exports.MarketplaceModule = MarketplaceModule;
exports.MarketplaceModule = MarketplaceModule = __decorate([
    (0, common_2.Module)({
        controllers: [listing_controller_1.ListingController, LegacyListingController, InquiryController],
        providers: [
            MarketplaceService,
            create_listing_use_case_1.CreateListingUseCase,
            search_listings_use_case_1.SearchListingsUseCase,
            get_listing_use_case_1.GetListingUseCase,
            get_saved_listings_use_case_1.GetSavedListingsUseCase,
            toggle_favourite_use_case_1.ToggleFavouriteUseCase,
            owner_listing_use_cases_1.GetMyListingsUseCase,
            owner_listing_use_cases_1.PublishListingUseCase,
            owner_listing_use_cases_1.PauseListingUseCase,
            owner_listing_use_cases_1.ArchiveListingUseCase,
            owner_listing_use_cases_1.RestoreListingUseCase,
            owner_listing_use_cases_1.DeleteListingUseCase,
            owner_listing_use_cases_1.UpdateListingUseCase,
            { provide: 'IListingRepository', useClass: prisma_listing_repository_1.PrismaListingRepository },
        ],
        exports: [MarketplaceService],
    })
], MarketplaceModule);
//# sourceMappingURL=marketplace.module.js.map