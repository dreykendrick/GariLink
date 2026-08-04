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
exports.VehicleController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../../../core/security/decorators/current-user.decorator");
const vehicle_dto_1 = require("../../application/dto/vehicle.dto");
const create_vehicle_use_case_1 = require("../../application/use-cases/create-vehicle.use-case");
const update_vehicle_use_case_1 = require("../../application/use-cases/update-vehicle.use-case");
const archive_vehicle_use_case_1 = require("../../application/use-cases/archive-vehicle.use-case");
const restore_vehicle_use_case_1 = require("../../application/use-cases/restore-vehicle.use-case");
const delete_vehicle_use_case_1 = require("../../application/use-cases/delete-vehicle.use-case");
const get_vehicle_use_case_1 = require("../../application/use-cases/get-vehicle.use-case");
const list_workspace_vehicles_use_case_1 = require("../../application/use-cases/list-workspace-vehicles.use-case");
let VehicleController = class VehicleController {
    constructor(createVehicleUseCase, updateVehicleUseCase, archiveVehicleUseCase, restoreVehicleUseCase, deleteVehicleUseCase, getVehicleUseCase, listWorkspaceVehiclesUseCase) {
        this.createVehicleUseCase = createVehicleUseCase;
        this.updateVehicleUseCase = updateVehicleUseCase;
        this.archiveVehicleUseCase = archiveVehicleUseCase;
        this.restoreVehicleUseCase = restoreVehicleUseCase;
        this.deleteVehicleUseCase = deleteVehicleUseCase;
        this.getVehicleUseCase = getVehicleUseCase;
        this.listWorkspaceVehiclesUseCase = listWorkspaceVehiclesUseCase;
    }
    async create(dto, user) {
        const result = await this.createVehicleUseCase.execute({ ...dto, userId: user.userId });
        if (result.isFail)
            throw result.error;
        const vehicle = result.value;
        return {
            id: vehicle.id,
            ...vehicle.props,
            year: vehicle.props.year.value,
            engineCapacity: vehicle.props.engineCapacity?.value,
            seats: vehicle.props.seats?.value,
            mileage: vehicle.props.mileage.value,
            vin: vehicle.props.vin?.value,
            registrationNumber: vehicle.props.registrationNumber?.value,
        };
    }
    async listWorkspaceVehicles(workspaceId, query) {
        const result = await this.listWorkspaceVehiclesUseCase.execute(workspaceId, query);
        if (result.isFail)
            throw result.error;
        return {
            ...result.value,
            data: result.value.data.map((vehicle) => ({
                id: vehicle.id,
                ...vehicle.props,
                year: vehicle.props.year.value,
                engineCapacity: vehicle.props.engineCapacity?.value,
                seats: vehicle.props.seats?.value,
                mileage: vehicle.props.mileage.value,
                vin: vehicle.props.vin?.value,
                registrationNumber: vehicle.props.registrationNumber?.value,
            })),
        };
    }
    async get(id) {
        const result = await this.getVehicleUseCase.execute(id);
        if (result.isFail)
            throw result.error;
        const vehicle = result.value;
        return {
            id: vehicle.id,
            ...vehicle.props,
            year: vehicle.props.year.value,
            engineCapacity: vehicle.props.engineCapacity?.value,
            seats: vehicle.props.seats?.value,
            mileage: vehicle.props.mileage.value,
            vin: vehicle.props.vin?.value,
            registrationNumber: vehicle.props.registrationNumber?.value,
        };
    }
    async update(id, dto, user) {
        const result = await this.updateVehicleUseCase.execute(id, dto, user.userId);
        if (result.isFail)
            throw result.error;
        const vehicle = result.value;
        return {
            id: vehicle.id,
            ...vehicle.props,
            year: vehicle.props.year.value,
            engineCapacity: vehicle.props.engineCapacity?.value,
            seats: vehicle.props.seats?.value,
            mileage: vehicle.props.mileage.value,
            vin: vehicle.props.vin?.value,
            registrationNumber: vehicle.props.registrationNumber?.value,
        };
    }
    async delete(id, user) {
        const result = await this.deleteVehicleUseCase.execute(id, user.userId);
        if (result.isFail)
            throw result.error;
    }
};
exports.VehicleController = VehicleController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add a vehicle to a workspace' }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [vehicle_dto_1.CreateVehicleDto, Object]),
    __metadata("design:returntype", Promise)
], VehicleController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('workspace/:workspaceId'),
    (0, swagger_1.ApiOperation)({ summary: 'List vehicles in a workspace' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('workspaceId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, vehicle_dto_1.VehicleQueryDto]),
    __metadata("design:returntype", Promise)
], VehicleController.prototype, "listWorkspaceVehicles", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get vehicle details' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VehicleController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update vehicle' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, vehicle_dto_1.UpdateVehicleDto, Object]),
    __metadata("design:returntype", Promise)
], VehicleController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Retire (soft delete) a vehicle' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VehicleController.prototype, "delete", null);
exports.VehicleController = VehicleController = __decorate([
    (0, swagger_1.ApiTags)('Vehicles'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('vehicles'),
    __metadata("design:paramtypes", [create_vehicle_use_case_1.CreateVehicleUseCase,
        update_vehicle_use_case_1.UpdateVehicleUseCase,
        archive_vehicle_use_case_1.ArchiveVehicleUseCase,
        restore_vehicle_use_case_1.RestoreVehicleUseCase,
        delete_vehicle_use_case_1.DeleteVehicleUseCase,
        get_vehicle_use_case_1.GetVehicleUseCase,
        list_workspace_vehicles_use_case_1.ListWorkspaceVehiclesUseCase])
], VehicleController);
//# sourceMappingURL=vehicle.controller.js.map