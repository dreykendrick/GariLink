import { Controller, Post, Body, Get, Param, Patch, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';
import { CreateRentalRequestUseCase } from '../use-cases/customer/create-rental-request.use-case';
import { CancelRentalRequestUseCase } from '../use-cases/customer/cancel-rental-request.use-case';
import { GetMyRentalRequestsUseCase } from '../use-cases/customer/get-my-rental-requests.use-case';

@UseGuards(JwtAuthGuard)
@Controller('rentals')
export class CustomerRentalController {
  constructor(
    private readonly createRentalRequest: CreateRentalRequestUseCase,
    private readonly cancelRentalRequest: CancelRentalRequestUseCase,
    private readonly getMyRentalRequests: GetMyRentalRequestsUseCase,
  ) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() body: any) {
    const userId = user.userId || user.id;
    const result = await this.createRentalRequest.execute({
      customerId: userId,
      workspaceId: body.workspaceId,
      vehicleId: body.vehicleId,
      listingId: body.listingId,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      dailyRate: body.dailyRate,
      totalAmount: body.totalAmount,
    });
    if (result.isFail) throw new HttpException(result.error.message, result.error.statusCode || HttpStatus.BAD_REQUEST);
    return { id: result.value.id };
  }

  @Patch(':id/cancel')
  async cancel(@CurrentUser() user: any, @Param('id') rentalId: string) {
    const userId = user.userId || user.id;
    const result = await this.cancelRentalRequest.execute({
      customerId: userId,
      rentalId,
    });
    if (result.isFail) throw new HttpException(result.error.message, result.error.statusCode || HttpStatus.BAD_REQUEST);
    return { success: true };
  }

  @Get()
  async getMy(@CurrentUser() user: any) {
    const userId = user.userId || user.id;
    const result = await this.getMyRentalRequests.execute(userId);
    if (result.isFail) throw new HttpException(result.error.message, result.error.statusCode || HttpStatus.BAD_REQUEST);
    return result.value.map(r => ({
      id: r.id,
      status: r.status,
      startDate: r.startDate,
      endDate: r.endDate,
    }));
  }
}
