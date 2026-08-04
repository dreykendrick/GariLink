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
exports.CreateListingUseCase = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const result_1 = require("../../../../shared/domain/result");
const app_error_1 = require("../../../../core/errors/app-error");
const listing_entity_1 = require("../../domain/entities/listing.entity");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma.service");
const audit_log_service_1 = require("../../../audit/audit-log.service");
const client_1 = require("@prisma/client");
const rental_config_vo_1 = require("../../domain/value-objects/rental-config.vo");
const daily_rate_vo_1 = require("../../domain/value-objects/daily-rate.vo");
const currency_vo_1 = require("../../domain/value-objects/currency.vo");
class ListingAccessDeniedError extends app_error_1.ForbiddenError {
    constructor() {
        super('You do not have access to this listing');
        this.code = 'LISTING_ACCESS_DENIED';
    }
}
let CreateListingUseCase = class CreateListingUseCase {
    constructor(repository, prisma, auditLog) {
        this.repository = repository;
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    async execute(input) {
        try {
            const vehicle = await this.prisma.vehicle.findUnique({
                where: { id: input.vehicleId },
            });
            if (!vehicle || vehicle.workspaceId !== input.workspaceId) {
                return result_1.Result.fail(new ListingAccessDeniedError());
            }
            if (vehicle.status !== client_1.VehicleStatus.AVAILABLE) {
                return result_1.Result.fail(new app_error_1.ForbiddenError('Vehicle must be AVAILABLE to be listed'));
            }
            let rentalConfig;
            if (input.type === 'FOR_HIRE' && input.rentalConfig) {
                const rc = input.rentalConfig;
                const currency = new currency_vo_1.Currency({ code: rc.currency ?? 'KES' });
                const dailyRate = new daily_rate_vo_1.DailyRate({ amount: rc.dailyRate, currency });
                rentalConfig = new rental_config_vo_1.RentalConfigVO({
                    dailyRate,
                    depositAmount: rc.depositAmount,
                    pickupCounty: rc.pickupCounty,
                    pickupCity: rc.pickupCity,
                    fuelPolicy: rc.fuelPolicy,
                    minimumRentalDays: rc.minimumRentalDays,
                });
            }
            const id = (0, uuid_1.v4)();
            const listing = listing_entity_1.Listing.create(id, {
                vehicleId: input.vehicleId,
                workspaceId: input.workspaceId,
                listerId: input.userId,
                type: input.type,
                title: input.title,
                description: input.description ?? null,
                currency: (input.pricingCurrency ?? 'KES'),
                askingPrice: input.askingPrice,
                negotiable: input.negotiable ?? true,
                status: client_1.ListingStatus.DRAFT,
                publishedAt: null,
                expiresAt: null,
                viewCount: 0,
                saveCount: 0,
                contactCount: 0,
                isFeatured: false,
                featuredUntil: null,
                conditionRating: input.conditionRating ?? null,
                conditionNotes: input.conditionNotes ?? null,
                tags: input.tags ?? [],
                county: input.county ?? null,
                country: 'KE',
                searchVector: null,
                deletedAt: null,
                rentalConfig,
            });
            await this.repository.save(listing);
            await this.auditLog.log({
                action: 'listing.created',
                actorId: input.userId,
                subjectType: 'Listing',
                subjectId: id,
                metadata: { vehicleId: input.vehicleId, type: input.type },
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
exports.CreateListingUseCase = CreateListingUseCase;
exports.CreateListingUseCase = CreateListingUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IListingRepository')),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], CreateListingUseCase);
//# sourceMappingURL=create-listing.use-case.js.map