"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleModule = void 0;
const common_1 = require("@nestjs/common");
const vehicle_controller_1 = require("./presentation/controllers/vehicle.controller");
const vehicle_availability_controller_1 = require("./presentation/controllers/vehicle-availability.controller");
const prisma_vehicle_repository_1 = require("./infrastructure/repositories/prisma-vehicle.repository");
const prisma_vehicle_availability_repository_1 = require("./infrastructure/repositories/prisma-vehicle-availability.repository");
const create_vehicle_use_case_1 = require("./application/use-cases/create-vehicle.use-case");
const update_vehicle_use_case_1 = require("./application/use-cases/update-vehicle.use-case");
const archive_vehicle_use_case_1 = require("./application/use-cases/archive-vehicle.use-case");
const restore_vehicle_use_case_1 = require("./application/use-cases/restore-vehicle.use-case");
const delete_vehicle_use_case_1 = require("./application/use-cases/delete-vehicle.use-case");
const get_vehicle_use_case_1 = require("./application/use-cases/get-vehicle.use-case");
const list_workspace_vehicles_use_case_1 = require("./application/use-cases/list-workspace-vehicles.use-case");
const block_vehicle_dates_use_case_1 = require("./application/use-cases/block-vehicle-dates.use-case");
const get_vehicle_availability_use_case_1 = require("./application/use-cases/get-vehicle-availability.use-case");
let VehicleModule = class VehicleModule {
};
exports.VehicleModule = VehicleModule;
exports.VehicleModule = VehicleModule = __decorate([
    (0, common_1.Module)({
        controllers: [vehicle_controller_1.VehicleController, vehicle_availability_controller_1.VehicleAvailabilityController],
        providers: [
            {
                provide: 'IVehicleRepository',
                useClass: prisma_vehicle_repository_1.PrismaVehicleRepository,
            },
            {
                provide: 'IVehicleAvailabilityRepository',
                useClass: prisma_vehicle_availability_repository_1.PrismaVehicleAvailabilityRepository,
            },
            create_vehicle_use_case_1.CreateVehicleUseCase,
            update_vehicle_use_case_1.UpdateVehicleUseCase,
            archive_vehicle_use_case_1.ArchiveVehicleUseCase,
            restore_vehicle_use_case_1.RestoreVehicleUseCase,
            delete_vehicle_use_case_1.DeleteVehicleUseCase,
            get_vehicle_use_case_1.GetVehicleUseCase,
            list_workspace_vehicles_use_case_1.ListWorkspaceVehiclesUseCase,
            block_vehicle_dates_use_case_1.BlockVehicleDatesUseCase,
            get_vehicle_availability_use_case_1.GetVehicleAvailabilityUseCase,
        ],
        exports: [
            'IVehicleRepository',
            'IVehicleAvailabilityRepository',
            create_vehicle_use_case_1.CreateVehicleUseCase,
            update_vehicle_use_case_1.UpdateVehicleUseCase,
            archive_vehicle_use_case_1.ArchiveVehicleUseCase,
            restore_vehicle_use_case_1.RestoreVehicleUseCase,
            delete_vehicle_use_case_1.DeleteVehicleUseCase,
            get_vehicle_use_case_1.GetVehicleUseCase,
            list_workspace_vehicles_use_case_1.ListWorkspaceVehiclesUseCase,
            block_vehicle_dates_use_case_1.BlockVehicleDatesUseCase,
            get_vehicle_availability_use_case_1.GetVehicleAvailabilityUseCase,
        ],
    })
], VehicleModule);
//# sourceMappingURL=vehicle.module.js.map