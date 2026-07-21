import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../../../core/security/decorators/current-user.decorator';
import { AccessJwtPayload } from '../../../../core/security/token.service';

import { BlockVehicleDatesDto } from '../../application/dto/vehicle-availability.dto';
import { BlockVehicleDatesUseCase } from '../../application/use-cases/block-vehicle-dates.use-case';
import { GetVehicleAvailabilityUseCase } from '../../application/use-cases/get-vehicle-availability.use-case';

@ApiTags('Vehicle Availability')
@ApiBearerAuth()
@Controller('vehicles/:id/availability')
export class VehicleAvailabilityController {
  constructor(
    private readonly blockVehicleDatesUseCase: BlockVehicleDatesUseCase,
    private readonly getVehicleAvailabilityUseCase: GetVehicleAvailabilityUseCase,
  ) {}

  @Post('block')
  @ApiOperation({ summary: 'Block vehicle dates' })
  async blockDates(
    @Param('id') vehicleId: string,
    @Body() dto: BlockVehicleDatesDto,
    @CurrentUser() user: AccessJwtPayload,
  ) {
    const result = await this.blockVehicleDatesUseCase.execute(vehicleId, dto, user.userId);
    if (result.isFail) throw result.error;
    
    const block = result.value;
    return {
      id: block.id,
      ...block.props,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get vehicle availability blocks' })
  async getAvailability(
    @Param('id') vehicleId: string,
    @CurrentUser() user: AccessJwtPayload,
  ) {
    const result = await this.getVehicleAvailabilityUseCase.execute(vehicleId, user.userId);
    if (result.isFail) throw result.error;
    
    return result.value.map(block => ({
      id: block.id,
      ...block.props,
    }));
  }
}
