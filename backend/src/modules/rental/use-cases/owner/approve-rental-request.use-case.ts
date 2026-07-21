import { Injectable, Inject } from '@nestjs/common';
import { IRentalRequestRepository } from '../../domain/repositories/rental-request.repository.interface';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { RentalNotFoundError, RentalAccessDeniedError, InvalidRentalTransitionError } from '../../domain/errors/rental.errors';
import { BlockType } from '@prisma/client';

export interface ApproveRentalRequestCommand {
  userId: string;
  rentalId: string;
}

@Injectable()
export class ApproveRentalRequestUseCase {
  constructor(
    @Inject('IRentalRequestRepository') private repo: IRentalRequestRepository,
    private prisma: PrismaService,
  ) {}

  async execute(cmd: ApproveRentalRequestCommand): Promise<Result<void, AppError>> {
    const rental = await this.repo.findById(cmd.rentalId);
    if (!rental) return Result.fail(new RentalNotFoundError());

    const member = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId: rental.workspaceId, userId: cmd.userId }
    });
    if (!member) return Result.fail(new RentalAccessDeniedError());

    try {
      rental.approve();
    } catch (err) {
      return Result.fail(new InvalidRentalTransitionError());
    }

    // Creating Availability Block directly here
    await this.prisma.vehicleAvailabilityBlock.create({
      data: {
        vehicleId: rental.vehicleId,
        startDate: rental.startDate,
        endDate: rental.endDate,
        type: BlockType.BOOKED,
        reason: `Rental Request: ${rental.id}`,
      }
    });

    await this.repo.save(rental);
    return Result.ok(undefined);
  }
}
