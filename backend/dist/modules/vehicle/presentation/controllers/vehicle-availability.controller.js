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
exports.VehicleAvailabilityController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../../../core/security/decorators/current-user.decorator");
const vehicle_availability_dto_1 = require("../../application/dto/vehicle-availability.dto");
const block_vehicle_dates_use_case_1 = require("../../application/use-cases/block-vehicle-dates.use-case");
const get_vehicle_availability_use_case_1 = require("../../application/use-cases/get-vehicle-availability.use-case");
let VehicleAvailabilityController = class VehicleAvailabilityController {
    constructor(blockVehicleDatesUseCase, getVehicleAvailabilityUseCase) {
        this.blockVehicleDatesUseCase = blockVehicleDatesUseCase;
        this.getVehicleAvailabilityUseCase = getVehicleAvailabilityUseCase;
    }
    async blockDates(vehicleId, dto, user) {
        const result = await this.blockVehicleDatesUseCase.execute(vehicleId, dto, user.userId);
        if (result.isFail)
            throw result.error;
        const block = result.value;
        return {
            id: block.id,
            ...block.props,
        };
    }
    async getAvailability(vehicleId, user) {
        const result = await this.getVehicleAvailabilityUseCase.execute(vehicleId, user.userId);
        if (result.isFail)
            throw result.error;
        return result.value.map(block => ({
            id: block.id,
            ...block.props,
        }));
    }
};
exports.VehicleAvailabilityController = VehicleAvailabilityController;
__decorate([
    (0, common_1.Post)('block'),
    (0, swagger_1.ApiOperation)({ summary: 'Block vehicle dates' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, vehicle_availability_dto_1.BlockVehicleDatesDto, Object]),
    __metadata("design:returntype", Promise)
], VehicleAvailabilityController.prototype, "blockDates", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get vehicle availability blocks' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VehicleAvailabilityController.prototype, "getAvailability", null);
exports.VehicleAvailabilityController = VehicleAvailabilityController = __decorate([
    (0, swagger_1.ApiTags)('Vehicle Availability'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('vehicles/:id/availability'),
    __metadata("design:paramtypes", [block_vehicle_dates_use_case_1.BlockVehicleDatesUseCase,
        get_vehicle_availability_use_case_1.GetVehicleAvailabilityUseCase])
], VehicleAvailabilityController);
//# sourceMappingURL=vehicle-availability.controller.js.map