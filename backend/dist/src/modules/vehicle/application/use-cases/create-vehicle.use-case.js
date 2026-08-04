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
exports.CreateVehicleUseCase = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const vehicle_entity_1 = require("../../domain/entities/vehicle.entity");
const result_1 = require("../../../../shared/domain/result");
const app_error_1 = require("../../../../core/errors/app-error");
const audit_log_service_1 = require("../../../audit/audit-log.service");
const vehicle_year_vo_1 = require("../../domain/value-objects/vehicle-year.vo");
const mileage_vo_1 = require("../../domain/value-objects/mileage.vo");
const seats_vo_1 = require("../../domain/value-objects/seats.vo");
const engine_capacity_vo_1 = require("../../domain/value-objects/engine-capacity.vo");
const vin_vo_1 = require("../../domain/value-objects/vin.vo");
const registration_number_vo_1 = require("../../domain/value-objects/registration-number.vo");
const client_1 = require("@prisma/client");
let CreateVehicleUseCase = class CreateVehicleUseCase {
    constructor(vehicleRepository, auditLog) {
        this.vehicleRepository = vehicleRepository;
        this.auditLog = auditLog;
    }
    async execute(dto) {
        try {
            const id = (0, uuid_1.v4)();
            const vehicle = vehicle_entity_1.Vehicle.create(id, {
                workspaceId: dto.workspaceId,
                type: dto.type,
                bodyType: dto.bodyType,
                make: dto.make,
                model: dto.model,
                year: new vehicle_year_vo_1.VehicleYear({ value: dto.year }),
                trim: dto.trim ?? null,
                fuelType: dto.fuelType,
                transmission: dto.transmission,
                drivetrain: dto.drivetrain,
                engineCapacity: dto.engineCapacity ? new engine_capacity_vo_1.EngineCapacity({ value: dto.engineCapacity }) : null,
                engineNumber: dto.engineNumber ?? null,
                horsepower: dto.horsepower ?? null,
                torque: dto.torque ?? null,
                fuelTankCapacity: dto.fuelTankCapacity ?? null,
                groundClearance: dto.groundClearance ?? null,
                wheelbase: dto.wheelbase ?? null,
                doors: dto.doors ?? null,
                seats: dto.seats ? new seats_vo_1.Seats({ value: dto.seats }) : null,
                condition: dto.condition,
                mileage: new mileage_vo_1.Mileage({ value: dto.mileage }),
                exteriorColor: dto.exteriorColor ?? null,
                interiorColor: dto.interiorColor ?? null,
                vin: dto.vin ? new vin_vo_1.Vin({ value: dto.vin }) : null,
                registrationNumber: dto.registrationNumber ? new registration_number_vo_1.RegistrationNumber({ value: dto.registrationNumber }) : null,
                features: dto.features ?? [],
                description: dto.description ?? null,
                primaryImageId: dto.primaryImageId ?? null,
                status: client_1.VehicleStatus.AVAILABLE,
                isVerified: false,
                geofenceEnabled: false,
            });
            await this.vehicleRepository.save(vehicle);
            await this.auditLog.log({
                action: 'vehicle.created',
                actorId: dto.userId,
                subjectType: 'Vehicle',
                subjectId: id,
                metadata: { workspaceId: dto.workspaceId, make: dto.make, model: dto.model },
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
exports.CreateVehicleUseCase = CreateVehicleUseCase;
exports.CreateVehicleUseCase = CreateVehicleUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IVehicleRepository')),
    __metadata("design:paramtypes", [Object, audit_log_service_1.AuditLogService])
], CreateVehicleUseCase);
//# sourceMappingURL=create-vehicle.use-case.js.map