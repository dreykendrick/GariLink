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
exports.GetVehicleAvailabilityUseCase = void 0;
const common_1 = require("@nestjs/common");
const result_1 = require("../../../../shared/domain/result");
const app_error_1 = require("../../../../core/errors/app-error");
const vehicle_errors_1 = require("../../domain/errors/vehicle.errors");
let GetVehicleAvailabilityUseCase = class GetVehicleAvailabilityUseCase {
    constructor(availabilityRepository, vehicleRepository) {
        this.availabilityRepository = availabilityRepository;
        this.vehicleRepository = vehicleRepository;
    }
    async execute(vehicleId, userId) {
        try {
            const vehicle = await this.vehicleRepository.findById(vehicleId);
            if (!vehicle) {
                return result_1.Result.fail(new vehicle_errors_1.VehicleNotFoundError());
            }
            const blocks = await this.availabilityRepository.findByVehicleId(vehicleId);
            return result_1.Result.ok(blocks);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError) {
                return result_1.Result.fail(error);
            }
            throw error;
        }
    }
};
exports.GetVehicleAvailabilityUseCase = GetVehicleAvailabilityUseCase;
exports.GetVehicleAvailabilityUseCase = GetVehicleAvailabilityUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IVehicleAvailabilityRepository')),
    __param(1, (0, common_1.Inject)('IVehicleRepository')),
    __metadata("design:paramtypes", [Object, Object])
], GetVehicleAvailabilityUseCase);
//# sourceMappingURL=get-vehicle-availability.use-case.js.map