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
exports.UpdateVehicleUseCase = void 0;
const common_1 = require("@nestjs/common");
const result_1 = require("../../../../shared/domain/result");
const app_error_1 = require("../../../../core/errors/app-error");
const vehicle_errors_1 = require("../../domain/errors/vehicle.errors");
const audit_log_service_1 = require("../../../audit/audit-log.service");
const vehicle_year_vo_1 = require("../../domain/value-objects/vehicle-year.vo");
const seats_vo_1 = require("../../domain/value-objects/seats.vo");
const engine_capacity_vo_1 = require("../../domain/value-objects/engine-capacity.vo");
const vin_vo_1 = require("../../domain/value-objects/vin.vo");
const registration_number_vo_1 = require("../../domain/value-objects/registration-number.vo");
let UpdateVehicleUseCase = class UpdateVehicleUseCase {
    constructor(vehicleRepository, auditLog) {
        this.vehicleRepository = vehicleRepository;
        this.auditLog = auditLog;
    }
    async execute(id, dto, userId) {
        try {
            const vehicle = await this.vehicleRepository.findById(id);
            if (!vehicle) {
                return result_1.Result.fail(new vehicle_errors_1.VehicleNotFoundError());
            }
            const updateData = {};
            if (dto.type !== undefined)
                updateData.type = dto.type;
            if (dto.bodyType !== undefined)
                updateData.bodyType = dto.bodyType;
            if (dto.make !== undefined)
                updateData.make = dto.make;
            if (dto.model !== undefined)
                updateData.model = dto.model;
            if (dto.year !== undefined)
                updateData.year = new vehicle_year_vo_1.VehicleYear({ value: dto.year });
            if (dto.trim !== undefined)
                updateData.trim = dto.trim;
            if (dto.fuelType !== undefined)
                updateData.fuelType = dto.fuelType;
            if (dto.transmission !== undefined)
                updateData.transmission = dto.transmission;
            if (dto.drivetrain !== undefined)
                updateData.drivetrain = dto.drivetrain;
            if (dto.engineCapacity !== undefined)
                updateData.engineCapacity = dto.engineCapacity ? new engine_capacity_vo_1.EngineCapacity({ value: dto.engineCapacity }) : null;
            if (dto.engineNumber !== undefined)
                updateData.engineNumber = dto.engineNumber;
            if (dto.horsepower !== undefined)
                updateData.horsepower = dto.horsepower;
            if (dto.torque !== undefined)
                updateData.torque = dto.torque;
            if (dto.fuelTankCapacity !== undefined)
                updateData.fuelTankCapacity = dto.fuelTankCapacity;
            if (dto.groundClearance !== undefined)
                updateData.groundClearance = dto.groundClearance;
            if (dto.wheelbase !== undefined)
                updateData.wheelbase = dto.wheelbase;
            if (dto.doors !== undefined)
                updateData.doors = dto.doors;
            if (dto.seats !== undefined)
                updateData.seats = dto.seats ? new seats_vo_1.Seats({ value: dto.seats }) : null;
            if (dto.condition !== undefined)
                updateData.condition = dto.condition;
            if (dto.exteriorColor !== undefined)
                updateData.exteriorColor = dto.exteriorColor;
            if (dto.interiorColor !== undefined)
                updateData.interiorColor = dto.interiorColor;
            if (dto.vin !== undefined)
                updateData.vin = dto.vin ? new vin_vo_1.Vin({ value: dto.vin }) : null;
            if (dto.registrationNumber !== undefined)
                updateData.registrationNumber = dto.registrationNumber ? new registration_number_vo_1.RegistrationNumber({ value: dto.registrationNumber }) : null;
            if (dto.features !== undefined)
                updateData.features = dto.features;
            if (dto.description !== undefined)
                updateData.description = dto.description;
            if (dto.primaryImageId !== undefined)
                updateData.primaryImageId = dto.primaryImageId;
            vehicle.update(updateData);
            if (dto.status !== undefined) {
                vehicle.updateStatus(dto.status);
            }
            if (dto.mileage !== undefined) {
                vehicle.updateMileage(dto.mileage);
            }
            await this.vehicleRepository.save(vehicle);
            await this.auditLog.log({
                action: 'vehicle.updated',
                actorId: userId,
                subjectType: 'Vehicle',
                subjectId: id,
            });
            return result_1.Result.ok(vehicle);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError) {
                return result_1.Result.fail(error);
            }
            throw error;
        }
    }
};
exports.UpdateVehicleUseCase = UpdateVehicleUseCase;
exports.UpdateVehicleUseCase = UpdateVehicleUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IVehicleRepository')),
    __metadata("design:paramtypes", [Object, audit_log_service_1.AuditLogService])
], UpdateVehicleUseCase);
//# sourceMappingURL=update-vehicle.use-case.js.map