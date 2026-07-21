import { Controller, Get, Param, Patch, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../core/security/guards/jwt-auth.guard';
import { GetWorkspaceRentalRequestsUseCase } from '../use-cases/owner/get-workspace-rental-requests.use-case';
import { ApproveRentalRequestUseCase } from '../use-cases/owner/approve-rental-request.use-case';
import { RejectRentalRequestUseCase } from '../use-cases/owner/reject-rental-request.use-case';
import { MarkRentalReadyUseCase } from '../use-cases/owner/mark-rental-ready.use-case';
import { StartRentalUseCase } from '../use-cases/owner/start-rental.use-case';
import { CompleteRentalUseCase } from '../use-cases/owner/complete-rental.use-case';

@UseGuards(JwtAuthGuard)
@Controller('owner/workspaces/:workspaceId/rentals')
export class OwnerRentalController {
  constructor(
    private readonly getWorkspaceRentalRequests: GetWorkspaceRentalRequestsUseCase,
    private readonly approveRentalRequest: ApproveRentalRequestUseCase,
    private readonly rejectRentalRequest: RejectRentalRequestUseCase,
    private readonly markRentalReady: MarkRentalReadyUseCase,
    private readonly startRental: StartRentalUseCase,
    private readonly completeRental: CompleteRentalUseCase,
  ) {}

  @Get()
  async getRequests(@CurrentUser() user: any, @Param('workspaceId') workspaceId: string) {
    const result = await this.getWorkspaceRentalRequests.execute(user.id, workspaceId);
    if (result.isFail) throw new HttpException(result.error.message, result.error.statusCode || HttpStatus.BAD_REQUEST);
    return result.value;
  }

  @Patch(':id/approve')
  async approve(@CurrentUser() user: any, @Param('id') rentalId: string) {
    const result = await this.approveRentalRequest.execute({ userId: user.id, rentalId });
    if (result.isFail) throw new HttpException(result.error.message, result.error.statusCode || HttpStatus.BAD_REQUEST);
    return { success: true };
  }

  @Patch(':id/reject')
  async reject(@CurrentUser() user: any, @Param('id') rentalId: string, @Body() body: any) {
    const result = await this.rejectRentalRequest.execute({ userId: user.id, rentalId, reason: body.reason });
    if (result.isFail) throw new HttpException(result.error.message, result.error.statusCode || HttpStatus.BAD_REQUEST);
    return { success: true };
  }

  @Patch(':id/ready')
  async ready(@CurrentUser() user: any, @Param('id') rentalId: string) {
    const result = await this.markRentalReady.execute({ userId: user.id, rentalId });
    if (result.isFail) throw new HttpException(result.error.message, result.error.statusCode || HttpStatus.BAD_REQUEST);
    return { success: true };
  }

  @Patch(':id/start')
  async start(@CurrentUser() user: any, @Param('id') rentalId: string) {
    const result = await this.startRental.execute({ userId: user.id, rentalId });
    if (result.isFail) throw new HttpException(result.error.message, result.error.statusCode || HttpStatus.BAD_REQUEST);
    return { success: true };
  }

  @Patch(':id/complete')
  async complete(@CurrentUser() user: any, @Param('id') rentalId: string) {
    const result = await this.completeRental.execute({ userId: user.id, rentalId });
    if (result.isFail) throw new HttpException(result.error.message, result.error.statusCode || HttpStatus.BAD_REQUEST);
    return { success: true };
  }
}
