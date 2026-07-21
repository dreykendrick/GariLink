import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { CreateVehicleDto } from '../dto/vehicle.dto';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { AuditLogService } from '../../../audit/audit-log.service';
import { VehicleYear } from '../../domain/value-objects/vehicle-year.vo';
import { Mileage } from '../../domain/value-objects/mileage.vo';
import { Seats } from '../../domain/value-objects/seats.vo';
import { EngineCapacity } from '../../domain/value-objects/engine-capacity.vo';
import { Vin } from '../../domain/value-objects/vin.vo';
import { RegistrationNumber } from '../../domain/value-objects/registration-number.vo';
import { VehicleStatus } from '@prisma/client';

@Injectable()
export class CreateVehicleUseCase {
  constructor(
    @Inject('IVehicleRepository')
    private readonly vehicleRepository: IVehicleRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(dto: CreateVehicleDto & { userId: string }): Promise<Result<Vehicle, AppError>> {
    try {
      const id = uuidv4();
      const vehicle = Vehicle.create(id, {
        workspaceId: dto.workspaceId,
        type: dto.type,
        bodyType: dto.bodyType,
        make: dto.make,
        model: dto.model,
        year: new VehicleYear({ value: dto.year }),
        trim: dto.trim ?? null,
        fuelType: dto.fuelType,
        transmission: dto.transmission,
        drivetrain: dto.drivetrain,
        engineCapacity: dto.engineCapacity ? new EngineCapacity({ value: dto.engineCapacity }) : null,
        engineNumber: dto.engineNumber ?? null,
        horsepower: dto.horsepower ?? null,
        torque: dto.torque ?? null,
        fuelTankCapacity: dto.fuelTankCapacity ?? null,
        groundClearance: dto.groundClearance ?? null,
        wheelbase: dto.wheelbase ?? null,
        doors: dto.doors ?? null,
        seats: dto.seats ? new Seats({ value: dto.seats }) : null,
        condition: dto.condition,
        mileage: new Mileage({ value: dto.mileage }),
        exteriorColor: dto.exteriorColor ?? null,
        interiorColor: dto.interiorColor ?? null,
        vin: dto.vin ? new Vin({ value: dto.vin }) : null,
        registrationNumber: dto.registrationNumber ? new RegistrationNumber({ value: dto.registrationNumber }) : null,
        features: dto.features ?? [],
        description: dto.description ?? null,
        primaryImageId: dto.primaryImageId ?? null,
        status: VehicleStatus.AVAILABLE,
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

      return Result.ok(vehicle);
    } catch (error: any) {
      if (error instanceof AppError) {
        return Result.fail(error);
      }
      throw error;
    }
  }
}
