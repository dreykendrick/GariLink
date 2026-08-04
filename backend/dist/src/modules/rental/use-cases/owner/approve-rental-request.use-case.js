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
exports.ApproveRentalRequestUseCase = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma.service");
const result_1 = require("../../../../shared/domain/result");
const rental_errors_1 = require("../../domain/errors/rental.errors");
const client_1 = require("@prisma/client");
let ApproveRentalRequestUseCase = class ApproveRentalRequestUseCase {
    constructor(repo, prisma) {
        this.repo = repo;
        this.prisma = prisma;
    }
    async execute(cmd) {
        const rental = await this.repo.findById(cmd.rentalId);
        if (!rental)
            return result_1.Result.fail(new rental_errors_1.RentalNotFoundError());
        const member = await this.prisma.workspaceMember.findFirst({
            where: { workspaceId: rental.workspaceId, userId: cmd.userId }
        });
        if (!member)
            return result_1.Result.fail(new rental_errors_1.RentalAccessDeniedError());
        try {
            rental.approve();
        }
        catch (err) {
            return result_1.Result.fail(new rental_errors_1.InvalidRentalTransitionError());
        }
        await this.prisma.vehicleAvailabilityBlock.create({
            data: {
                vehicleId: rental.vehicleId,
                startDate: rental.startDate,
                endDate: rental.endDate,
                type: client_1.BlockType.BOOKED,
                reason: `Rental Request: ${rental.id}`,
            }
        });
        await this.repo.save(rental);
        return result_1.Result.ok(undefined);
    }
};
exports.ApproveRentalRequestUseCase = ApproveRentalRequestUseCase;
exports.ApproveRentalRequestUseCase = ApproveRentalRequestUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IRentalRequestRepository')),
    __metadata("design:paramtypes", [Object, prisma_service_1.PrismaService])
], ApproveRentalRequestUseCase);
//# sourceMappingURL=approve-rental-request.use-case.js.map