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
exports.CustomerRentalController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../../core/security/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../../../core/security/guards/jwt-auth.guard");
const create_rental_request_use_case_1 = require("../use-cases/customer/create-rental-request.use-case");
const cancel_rental_request_use_case_1 = require("../use-cases/customer/cancel-rental-request.use-case");
const get_my_rental_requests_use_case_1 = require("../use-cases/customer/get-my-rental-requests.use-case");
let CustomerRentalController = class CustomerRentalController {
    constructor(createRentalRequest, cancelRentalRequest, getMyRentalRequests) {
        this.createRentalRequest = createRentalRequest;
        this.cancelRentalRequest = cancelRentalRequest;
        this.getMyRentalRequests = getMyRentalRequests;
    }
    async create(user, body) {
        const userId = user.userId || user.id;
        const result = await this.createRentalRequest.execute({
            customerId: userId,
            workspaceId: body.workspaceId,
            vehicleId: body.vehicleId,
            listingId: body.listingId,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            dailyRate: body.dailyRate,
            totalAmount: body.totalAmount,
        });
        if (result.isFail)
            throw new common_1.HttpException(result.error.message, result.error.statusCode || common_1.HttpStatus.BAD_REQUEST);
        return { id: result.value.id };
    }
    async cancel(user, rentalId) {
        const userId = user.userId || user.id;
        const result = await this.cancelRentalRequest.execute({
            customerId: userId,
            rentalId,
        });
        if (result.isFail)
            throw new common_1.HttpException(result.error.message, result.error.statusCode || common_1.HttpStatus.BAD_REQUEST);
        return { success: true };
    }
    async getMy(user) {
        const userId = user.userId || user.id;
        const result = await this.getMyRentalRequests.execute(userId);
        if (result.isFail)
            throw new common_1.HttpException(result.error.message, result.error.statusCode || common_1.HttpStatus.BAD_REQUEST);
        return result.value.map(r => ({
            id: r.id,
            status: r.status,
            startDate: r.startDate,
            endDate: r.endDate,
        }));
    }
};
exports.CustomerRentalController = CustomerRentalController;
__decorate([
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CustomerRentalController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CustomerRentalController.prototype, "cancel", null);
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomerRentalController.prototype, "getMy", null);
exports.CustomerRentalController = CustomerRentalController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('rentals'),
    __metadata("design:paramtypes", [create_rental_request_use_case_1.CreateRentalRequestUseCase,
        cancel_rental_request_use_case_1.CancelRentalRequestUseCase,
        get_my_rental_requests_use_case_1.GetMyRentalRequestsUseCase])
], CustomerRentalController);
//# sourceMappingURL=customer-rental.controller.js.map