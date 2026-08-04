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
exports.UpdateListingUseCase = exports.DeleteListingUseCase = exports.RestoreListingUseCase = exports.ArchiveListingUseCase = exports.PauseListingUseCase = exports.PublishListingUseCase = exports.GetMyListingsUseCase = void 0;
const common_1 = require("@nestjs/common");
const result_1 = require("../../../../shared/domain/result");
const app_error_1 = require("../../../../core/errors/app-error");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma.service");
const audit_log_service_1 = require("../../../audit/audit-log.service");
class ListingAccessDeniedError extends app_error_1.ForbiddenError {
    constructor() {
        super('You do not have access to this listing');
        this.code = 'LISTING_ACCESS_DENIED';
    }
}
let GetMyListingsUseCase = class GetMyListingsUseCase {
    constructor(repository, prisma) {
        this.repository = repository;
        this.prisma = prisma;
    }
    async execute(userId, params) {
        try {
            const workspace = await this.prisma.workspace.findFirst({
                where: { ownerId: userId },
            });
            if (!workspace) {
                return result_1.Result.fail(new app_error_1.NotFoundError('Workspace not found for user'));
            }
            const listings = await this.repository.findMyListings(workspace.id, params);
            return result_1.Result.ok(listings);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            return result_1.Result.fail(new app_error_1.ConflictError(error.message));
        }
    }
};
exports.GetMyListingsUseCase = GetMyListingsUseCase;
exports.GetMyListingsUseCase = GetMyListingsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IListingRepository')),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService])
], GetMyListingsUseCase);
let PublishListingUseCase = class PublishListingUseCase {
    constructor(repository, prisma, auditLog) {
        this.repository = repository;
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    async execute(userId, listingId) {
        try {
            const listing = await this.repository.findById(listingId);
            if (!listing)
                return result_1.Result.fail(new app_error_1.NotFoundError('Listing not found'));
            const workspace = await this.prisma.workspace.findFirst({
                where: { id: listing.workspaceId, ownerId: userId },
            });
            if (!workspace)
                return result_1.Result.fail(new ListingAccessDeniedError());
            listing.publish();
            await this.repository.save(listing);
            await this.auditLog.log({
                action: 'listing.published',
                actorId: userId,
                subjectType: 'Listing',
                subjectId: listing.id,
            });
            return result_1.Result.ok(listing);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            return result_1.Result.fail(new app_error_1.ConflictError(error.message));
        }
    }
};
exports.PublishListingUseCase = PublishListingUseCase;
exports.PublishListingUseCase = PublishListingUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IListingRepository')),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], PublishListingUseCase);
let PauseListingUseCase = class PauseListingUseCase {
    constructor(repository, prisma, auditLog) {
        this.repository = repository;
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    async execute(userId, listingId) {
        try {
            const listing = await this.repository.findById(listingId);
            if (!listing)
                return result_1.Result.fail(new app_error_1.NotFoundError('Listing not found'));
            const workspace = await this.prisma.workspace.findFirst({
                where: { id: listing.workspaceId, ownerId: userId },
            });
            if (!workspace)
                return result_1.Result.fail(new ListingAccessDeniedError());
            listing.pause();
            await this.repository.save(listing);
            await this.auditLog.log({
                action: 'listing.paused',
                actorId: userId,
                subjectType: 'Listing',
                subjectId: listing.id,
            });
            return result_1.Result.ok(listing);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            return result_1.Result.fail(new app_error_1.ConflictError(error.message));
        }
    }
};
exports.PauseListingUseCase = PauseListingUseCase;
exports.PauseListingUseCase = PauseListingUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IListingRepository')),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], PauseListingUseCase);
let ArchiveListingUseCase = class ArchiveListingUseCase {
    constructor(repository, prisma, auditLog) {
        this.repository = repository;
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    async execute(userId, listingId) {
        try {
            const listing = await this.repository.findById(listingId);
            if (!listing)
                return result_1.Result.fail(new app_error_1.NotFoundError('Listing not found'));
            const workspace = await this.prisma.workspace.findFirst({
                where: { id: listing.workspaceId, ownerId: userId },
            });
            if (!workspace)
                return result_1.Result.fail(new ListingAccessDeniedError());
            listing.archive();
            await this.repository.save(listing);
            await this.auditLog.log({
                action: 'listing.archived',
                actorId: userId,
                subjectType: 'Listing',
                subjectId: listing.id,
            });
            return result_1.Result.ok(listing);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            return result_1.Result.fail(new app_error_1.ConflictError(error.message));
        }
    }
};
exports.ArchiveListingUseCase = ArchiveListingUseCase;
exports.ArchiveListingUseCase = ArchiveListingUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IListingRepository')),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], ArchiveListingUseCase);
let RestoreListingUseCase = class RestoreListingUseCase {
    constructor(repository, prisma, auditLog) {
        this.repository = repository;
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    async execute(userId, listingId) {
        try {
            const listing = await this.repository.findById(listingId);
            if (!listing)
                return result_1.Result.fail(new app_error_1.NotFoundError('Listing not found'));
            const workspace = await this.prisma.workspace.findFirst({
                where: { id: listing.workspaceId, ownerId: userId },
            });
            if (!workspace)
                return result_1.Result.fail(new ListingAccessDeniedError());
            listing.restore();
            await this.repository.save(listing);
            await this.auditLog.log({
                action: 'listing.restored',
                actorId: userId,
                subjectType: 'Listing',
                subjectId: listing.id,
            });
            return result_1.Result.ok(listing);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            return result_1.Result.fail(new app_error_1.ConflictError(error.message));
        }
    }
};
exports.RestoreListingUseCase = RestoreListingUseCase;
exports.RestoreListingUseCase = RestoreListingUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IListingRepository')),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], RestoreListingUseCase);
let DeleteListingUseCase = class DeleteListingUseCase {
    constructor(repository, prisma, auditLog) {
        this.repository = repository;
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    async execute(userId, listingId) {
        try {
            const listing = await this.repository.findById(listingId);
            if (!listing)
                return result_1.Result.fail(new app_error_1.NotFoundError('Listing not found'));
            const workspace = await this.prisma.workspace.findFirst({
                where: { id: listing.workspaceId, ownerId: userId },
            });
            if (!workspace)
                return result_1.Result.fail(new ListingAccessDeniedError());
            listing.softDelete();
            await this.repository.save(listing);
            await this.repository.softDelete(listingId);
            await this.auditLog.log({
                action: 'listing.deleted',
                actorId: userId,
                subjectType: 'Listing',
                subjectId: listing.id,
            });
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            return result_1.Result.fail(new app_error_1.ConflictError(error.message));
        }
    }
};
exports.DeleteListingUseCase = DeleteListingUseCase;
exports.DeleteListingUseCase = DeleteListingUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IListingRepository')),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], DeleteListingUseCase);
let UpdateListingUseCase = class UpdateListingUseCase {
    constructor(repository, prisma, auditLog) {
        this.repository = repository;
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    async execute(userId, listingId, updateData) {
        try {
            const listing = await this.repository.findById(listingId);
            if (!listing)
                return result_1.Result.fail(new app_error_1.NotFoundError('Listing not found'));
            const workspace = await this.prisma.workspace.findFirst({
                where: { id: listing.workspaceId, ownerId: userId },
            });
            if (!workspace)
                return result_1.Result.fail(new ListingAccessDeniedError());
            const { vehicleId, workspaceId, listerId, status, id, ...safeUpdateData } = updateData;
            listing.update(safeUpdateData);
            await this.repository.save(listing);
            await this.auditLog.log({
                action: 'listing.updated',
                actorId: userId,
                subjectType: 'Listing',
                subjectId: listing.id,
            });
            return result_1.Result.ok(listing);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            return result_1.Result.fail(new app_error_1.ConflictError(error.message));
        }
    }
};
exports.UpdateListingUseCase = UpdateListingUseCase;
exports.UpdateListingUseCase = UpdateListingUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IListingRepository')),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], UpdateListingUseCase);
//# sourceMappingURL=owner-listing.use-cases.js.map