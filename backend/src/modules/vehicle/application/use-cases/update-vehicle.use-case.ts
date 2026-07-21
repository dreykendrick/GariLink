import { Injectable, Inject } from '@nestjs/common';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { UpdateVehicleDto } from '../dto/vehicle.dto';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { VehicleNotFoundError } from '../../domain/errors/vehicle.errors';
import { AuditLogService } from '../../../audit/audit-log.service';
import { VehicleYear } from '../../domain/value-objects/vehicle-year.vo';
import { Mileage } from '../../domain/value-objects/mileage.vo';
import { Seats } from '../../domain/value-objects/seats.vo';
import { EngineCapacity } from '../../domain/value-objects/engine-capacity.vo';
import { Vin } from '../../domain/value-objects/vin.vo';
import { RegistrationNumber } from '../../domain/value-objects/registration-number.vo';

@Injectable()
export class UpdateVehicleUseCase {
  constructor(
    @Inject('IVehicleRepository')
    private readonly vehicleRepository: IVehicleRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(id: string, dto: UpdateVehicleDto, userId: string): Promise<Result<Vehicle, AppError>> {
    try {
      const vehicle = await this.vehicleRepository.findById(id);
      if (!vehicle) {
        return Result.fail(new VehicleNotFoundError());
      }

      const updateData: any = {};
      if (dto.type !== undefined) updateData.type = dto.type;
      if (dto.bodyType !== undefined) updateData.bodyType = dto.bodyType;
      if (dto.make !== undefined) updateData.make = dto.make;
      if (dto.model !== undefined) updateData.model = dto.model;
      if (dto.year !== undefined) updateData.year = new VehicleYear({ value: dto.year });
      if (dto.trim !== undefined) updateData.trim = dto.trim;
      if (dto.fuelType !== undefined) updateData.fuelType = dto.fuelType;
      if (dto.transmission !== undefined) updateData.transmission = dto.transmission;
      if (dto.drivetrain !== undefined) updateData.drivetrain = dto.drivetrain;
      if (dto.engineCapacity !== undefined) updateData.engineCapacity = dto.engineCapacity ? new EngineCapacity({ value: dto.engineCapacity }) : null;
      if (dto.engineNumber !== undefined) updateData.engineNumber = dto.engineNumber;
      if (dto.horsepower !== undefined) updateData.horsepower = dto.horsepower;
      if (dto.torque !== undefined) updateData.torque = dto.torque;
      if (dto.fuelTankCapacity !== undefined) updateData.fuelTankCapacity = dto.fuelTankCapacity;
      if (dto.groundClearance !== undefined) updateData.groundClearance = dto.groundClearance;
      if (dto.wheelbase !== undefined) updateData.wheelbase = dto.wheelbase;
      if (dto.doors !== undefined) updateData.doors = dto.doors;
      if (dto.seats !== undefined) updateData.seats = dto.seats ? new Seats({ value: dto.seats }) : null;
      if (dto.condition !== undefined) updateData.condition = dto.condition;
      if (dto.exteriorColor !== undefined) updateData.exteriorColor = dto.exteriorColor;
      if (dto.interiorColor !== undefined) updateData.interiorColor = dto.interiorColor;
      if (dto.vin !== undefined) updateData.vin = dto.vin ? new Vin({ value: dto.vin }) : null;
      if (dto.registrationNumber !== undefined) updateData.registrationNumber = dto.registrationNumber ? new RegistrationNumber({ value: dto.registrationNumber }) : null;
      if (dto.features !== undefined) updateData.features = dto.features;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.primaryImageId !== undefined) updateData.primaryImageId = dto.primaryImageId;

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

      return Result.ok(vehicle);
    } catch (error: any) {
      if (error instanceof AppError) {
        return Result.fail(error);
      }
      throw error;
    }
  }
}
