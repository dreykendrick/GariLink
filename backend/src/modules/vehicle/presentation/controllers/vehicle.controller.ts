import {
  Controller, Post, Get, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../../../core/security/decorators/current-user.decorator';
import { AccessJwtPayload } from '../../../../core/security/token.service';

import { CreateVehicleDto, UpdateVehicleDto, VehicleQueryDto } from '../../application/dto/vehicle.dto';
import { CreateVehicleUseCase } from '../../application/use-cases/create-vehicle.use-case';
import { UpdateVehicleUseCase } from '../../application/use-cases/update-vehicle.use-case';
import { ArchiveVehicleUseCase } from '../../application/use-cases/archive-vehicle.use-case';
import { RestoreVehicleUseCase } from '../../application/use-cases/restore-vehicle.use-case';
import { DeleteVehicleUseCase } from '../../application/use-cases/delete-vehicle.use-case';
import { GetVehicleUseCase } from '../../application/use-cases/get-vehicle.use-case';
import { ListWorkspaceVehiclesUseCase } from '../../application/use-cases/list-workspace-vehicles.use-case';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehicleController {
  constructor(
    private readonly createVehicleUseCase: CreateVehicleUseCase,
    private readonly updateVehicleUseCase: UpdateVehicleUseCase,
    private readonly archiveVehicleUseCase: ArchiveVehicleUseCase,
    private readonly restoreVehicleUseCase: RestoreVehicleUseCase,
    private readonly deleteVehicleUseCase: DeleteVehicleUseCase,
    private readonly getVehicleUseCase: GetVehicleUseCase,
    private readonly listWorkspaceVehiclesUseCase: ListWorkspaceVehiclesUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add a vehicle to a workspace' })
  async create(@Body() dto: CreateVehicleDto, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.createVehicleUseCase.execute({ ...dto, userId: user.userId });
    if (result.isFail) throw result.error;
    
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

  @Get('workspace/:workspaceId')
  @ApiOperation({ summary: 'List vehicles in a workspace' })
  async listWorkspaceVehicles(
    @Param('workspaceId') workspaceId: string,
    @Query() query: VehicleQueryDto
  ) {
    const result = await this.listWorkspaceVehiclesUseCase.execute(workspaceId, query);
    if (result.isFail) throw result.error;
    
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

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle details' })
  async get(@Param('id') id: string) {
    const result = await this.getVehicleUseCase.execute(id);
    if (result.isFail) throw result.error;
    
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

  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user: AccessJwtPayload,
  ) {
    const result = await this.updateVehicleUseCase.execute(id, dto, user.userId);
    if (result.isFail) throw result.error;
    
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retire (soft delete) a vehicle' })
  async delete(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.deleteVehicleUseCase.execute(id, user.userId);
    if (result.isFail) throw result.error;
  }
}
