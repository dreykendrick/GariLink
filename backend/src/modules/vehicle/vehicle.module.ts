import { Module } from '@nestjs/common';
import { VehicleController } from './presentation/controllers/vehicle.controller';
import { VehicleAvailabilityController } from './presentation/controllers/vehicle-availability.controller';
import { PrismaVehicleRepository } from './infrastructure/repositories/prisma-vehicle.repository';
import { PrismaVehicleAvailabilityRepository } from './infrastructure/repositories/prisma-vehicle-availability.repository';
import { CreateVehicleUseCase } from './application/use-cases/create-vehicle.use-case';
import { UpdateVehicleUseCase } from './application/use-cases/update-vehicle.use-case';
import { ArchiveVehicleUseCase } from './application/use-cases/archive-vehicle.use-case';
import { RestoreVehicleUseCase } from './application/use-cases/restore-vehicle.use-case';
import { DeleteVehicleUseCase } from './application/use-cases/delete-vehicle.use-case';
import { GetVehicleUseCase } from './application/use-cases/get-vehicle.use-case';
import { ListWorkspaceVehiclesUseCase } from './application/use-cases/list-workspace-vehicles.use-case';
import { BlockVehicleDatesUseCase } from './application/use-cases/block-vehicle-dates.use-case';
import { GetVehicleAvailabilityUseCase } from './application/use-cases/get-vehicle-availability.use-case';

@Module({
  controllers: [VehicleController, VehicleAvailabilityController],
  providers: [
    {
      provide: 'IVehicleRepository',
      useClass: PrismaVehicleRepository,
    },
    {
      provide: 'IVehicleAvailabilityRepository',
      useClass: PrismaVehicleAvailabilityRepository,
    },
    CreateVehicleUseCase,
    UpdateVehicleUseCase,
    ArchiveVehicleUseCase,
    RestoreVehicleUseCase,
    DeleteVehicleUseCase,
    GetVehicleUseCase,
    ListWorkspaceVehiclesUseCase,
    BlockVehicleDatesUseCase,
    GetVehicleAvailabilityUseCase,
  ],
  exports: [
    'IVehicleRepository',
    'IVehicleAvailabilityRepository',
    CreateVehicleUseCase,
    UpdateVehicleUseCase,
    ArchiveVehicleUseCase,
    RestoreVehicleUseCase,
    DeleteVehicleUseCase,
    GetVehicleUseCase,
    ListWorkspaceVehiclesUseCase,
    BlockVehicleDatesUseCase,
    GetVehicleAvailabilityUseCase,
  ],
})
export class VehicleModule {}

