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
exports.OwnerRentalController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../../core/security/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../../core/security/guards/jwt-auth.guard");
const get_workspace_rental_requests_use_case_1 = require("../use-cases/owner/get-workspace-rental-requests.use-case");
const approve_rental_request_use_case_1 = require("../use-cases/owner/approve-rental-request.use-case");
const reject_rental_request_use_case_1 = require("../use-cases/owner/reject-rental-request.use-case");
const mark_rental_ready_use_case_1 = require("../use-cases/owner/mark-rental-ready.use-case");
const start_rental_use_case_1 = require("../use-cases/owner/start-rental.use-case");
const complete_rental_use_case_1 = require("../use-cases/owner/complete-rental.use-case");
let OwnerRentalController = class OwnerRentalController {
    constructor(getWorkspaceRentalRequests, approveRentalRequest, rejectRentalRequest, markRentalReady, startRental, completeRental) {
        this.getWorkspaceRentalRequests = getWorkspaceRentalRequests;
        this.approveRentalRequest = approveRentalRequest;
        this.rejectRentalRequest = rejectRentalRequest;
        this.markRentalReady = markRentalReady;
        this.startRental = startRental;
        this.completeRental = completeRental;
    }
    async getRequests(user, workspaceId) {
        const result = await this.getWorkspaceRentalRequests.execute(user.id, workspaceId);
        if (result.isFail)
            throw new common_1.HttpException(result.error.message, result.error.statusCode || common_1.HttpStatus.BAD_REQUEST);
        return result.value;
    }
    async approve(user, rentalId) {
        const result = await this.approveRentalRequest.execute({ userId: user.id, rentalId });
        if (result.isFail)
            throw new common_1.HttpException(result.error.message, result.error.statusCode || common_1.HttpStatus.BAD_REQUEST);
        return { success: true };
    }
    async reject(user, rentalId, body) {
        const result = await this.rejectRentalRequest.execute({ userId: user.id, rentalId, reason: body.reason });
        if (result.isFail)
            throw new common_1.HttpException(result.error.message, result.error.statusCode || common_1.HttpStatus.BAD_REQUEST);
        return { success: true };
    }
    async ready(user, rentalId) {
        const result = await this.markRentalReady.execute({ userId: user.id, rentalId });
        if (result.isFail)
            throw new common_1.HttpException(result.error.message, result.error.statusCode || common_1.HttpStatus.BAD_REQUEST);
        return { success: true };
    }
    async start(user, rentalId) {
        const result = await this.startRental.execute({ userId: user.id, rentalId });
        if (result.isFail)
            throw new common_1.HttpException(result.error.message, result.error.statusCode || common_1.HttpStatus.BAD_REQUEST);
        return { success: true };
    }
    async complete(user, rentalId) {
        const result = await this.completeRental.execute({ userId: user.id, rentalId });
        if (result.isFail)
            throw new common_1.HttpException(result.error.message, result.error.statusCode || common_1.HttpStatus.BAD_REQUEST);
        return { success: true };
    }
};
exports.OwnerRentalController = OwnerRentalController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200, type: [require("../domain/entities/rental-request.entity").RentalRequest] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OwnerRentalController.prototype, "getRequests", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OwnerRentalController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], OwnerRentalController.prototype, "reject", null);
__decorate([
    (0, common_1.Patch)(':id/ready'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OwnerRentalController.prototype, "ready", null);
__decorate([
    (0, common_1.Patch)(':id/start'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OwnerRentalController.prototype, "start", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OwnerRentalController.prototype, "complete", null);
exports.OwnerRentalController = OwnerRentalController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('owner/workspaces/:workspaceId/rentals'),
    __metadata("design:paramtypes", [get_workspace_rental_requests_use_case_1.GetWorkspaceRentalRequestsUseCase,
        approve_rental_request_use_case_1.ApproveRentalRequestUseCase,
        reject_rental_request_use_case_1.RejectRentalRequestUseCase,
        mark_rental_ready_use_case_1.MarkRentalReadyUseCase,
        start_rental_use_case_1.StartRentalUseCase,
        complete_rental_use_case_1.CompleteRentalUseCase])
], OwnerRentalController);
//# sourceMappingURL=owner-rental.controller.js.map