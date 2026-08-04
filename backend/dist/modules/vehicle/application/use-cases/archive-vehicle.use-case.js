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
exports.ArchiveVehicleUseCase = void 0;
const common_1 = require("@nestjs/common");
const result_1 = require("../../../../shared/domain/result");
const app_error_1 = require("../../../../core/errors/app-error");
const vehicle_errors_1 = require("../../domain/errors/vehicle.errors");
const audit_log_service_1 = require("../../../audit/audit-log.service");
const client_1 = require("@prisma/client");
let ArchiveVehicleUseCase = class ArchiveVehicleUseCase {
    constructor(vehicleRepository, auditLog) {
        this.vehicleRepository = vehicleRepository;
        this.auditLog = auditLog;
    }
    async execute(id, userId) {
        try {
            const vehicle = await this.vehicleRepository.findById(id);
            if (!vehicle) {
                return result_1.Result.fail(new vehicle_errors_1.VehicleNotFoundError());
            }
            vehicle.updateStatus(client_1.VehicleStatus.ARCHIVED);
            await this.vehicleRepository.save(vehicle);
            await this.auditLog.log({
                action: 'vehicle.archived',
                actorId: userId,
                subjectType: 'Vehicle',
                subjectId: id,
            });
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError) {
                return result_1.Result.fail(error);
            }
            throw error;
        }
    }
};
exports.ArchiveVehicleUseCase = ArchiveVehicleUseCase;
exports.ArchiveVehicleUseCase = ArchiveVehicleUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IVehicleRepository')),
    __metadata("design:paramtypes", [Object, audit_log_service_1.AuditLogService])
], ArchiveVehicleUseCase);
//# sourceMappingURL=archive-vehicle.use-case.js.map