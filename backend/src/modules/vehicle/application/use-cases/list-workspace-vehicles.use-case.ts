import { Injectable, Inject } from '@nestjs/common';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { PaginatedResult } from '../../../../shared/application/paginated-result';
import { VehicleQueryDto } from '../dto/vehicle.dto';

@Injectable()
export class ListWorkspaceVehiclesUseCase {
  constructor(
    @Inject('IVehicleRepository')
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(workspaceId: string, query: VehicleQueryDto): Promise<Result<PaginatedResult<Vehicle>, AppError>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, query.limit ?? 20);
    const offset = (page - 1) * limit;

    const { data, total } = await this.vehicleRepository.findByWorkspaceId(workspaceId, limit, offset);
    
    // In a real app we might do filtering in repo by expanding findByWorkspaceId arguments,
    // but the task requirements didn't specify complex query logic for list.
    // For now we will return just the paginated result for workspace.

    const result = PaginatedResult.of(data, page, limit, total);
    return Result.ok(result);
  }
}
