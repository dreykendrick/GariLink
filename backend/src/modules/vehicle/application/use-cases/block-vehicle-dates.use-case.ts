import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IVehicleAvailabilityRepository } from '../../domain/repositories/vehicle-availability.repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { VehicleAvailabilityBlock } from '../../domain/entities/vehicle-availability-block.entity';
import { BlockVehicleDatesDto } from '../dto/vehicle-availability.dto';
import { Result } from '../../../../shared/domain/result';
import { AppError, ConflictError, ForbiddenError } from '../../../../core/errors/app-error';
import { VehicleNotFoundError } from '../../domain/errors/vehicle.errors';

export class OverlappingBlockError extends ConflictError {
  override readonly code = 'OVERLAPPING_BLOCK';
  constructor() { super('The selected dates overlap with an existing block'); }
}

@Injectable()
export class BlockVehicleDatesUseCase {
  constructor(
    @Inject('IVehicleAvailabilityRepository')
    private readonly availabilityRepository: IVehicleAvailabilityRepository,
    @Inject('IVehicleRepository')
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(vehicleId: string, dto: BlockVehicleDatesDto, userId: string): Promise<Result<VehicleAvailabilityBlock, AppError>> {
    try {
      const vehicle = await this.vehicleRepository.findById(vehicleId);
      if (!vehicle) {
        return Result.fail(new VehicleNotFoundError());
      }
      
      // Note: In a complete implementation, verify if userId has access to vehicle.workspaceId
      // For example, by calling a workspace service to check permissions.
      
      const overlappingBlocks = await this.availabilityRepository.findOverlappingBlocks(
        vehicleId, 
        new Date(dto.startDate), 
        new Date(dto.endDate)
      );

      if (overlappingBlocks.length > 0) {
        return Result.fail(new OverlappingBlockError());
      }

      const block = VehicleAvailabilityBlock.create(uuidv4(), {
        vehicleId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        type: dto.type,
        reason: dto.reason ?? null,
      });

      await this.availabilityRepository.save(block);
      
      return Result.ok(block);
    } catch (error: any) {
      if (error instanceof AppError) {
        return Result.fail(error);
      }
      throw error;
    }
  }
}
