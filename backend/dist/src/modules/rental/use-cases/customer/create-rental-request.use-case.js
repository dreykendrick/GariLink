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
exports.CreateRentalRequestUseCase = void 0;
const common_1 = require("@nestjs/common");
const rental_request_entity_1 = require("../../domain/entities/rental-request.entity");
const result_1 = require("../../../../shared/domain/result");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
let CreateRentalRequestUseCase = class CreateRentalRequestUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(cmd) {
        const rental = rental_request_entity_1.RentalRequest.create((0, uuid_1.v4)(), {
            customerId: cmd.customerId,
            workspaceId: cmd.workspaceId,
            vehicleId: cmd.vehicleId,
            listingId: cmd.listingId,
            status: client_1.RentalStatus.REQUESTED,
            startDate: cmd.startDate,
            endDate: cmd.endDate,
            dailyRate: cmd.dailyRate,
            currency: client_1.Currency.KES,
            totalAmount: cmd.totalAmount,
            depositAmount: null,
            pickupNotes: null,
            rejectionReason: null,
        });
        await this.repo.save(rental);
        return result_1.Result.ok(rental);
    }
};
exports.CreateRentalRequestUseCase = CreateRentalRequestUseCase;
exports.CreateRentalRequestUseCase = CreateRentalRequestUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IRentalRequestRepository')),
    __metadata("design:paramtypes", [Object])
], CreateRentalRequestUseCase);
//# sourceMappingURL=create-rental-request.use-case.js.map