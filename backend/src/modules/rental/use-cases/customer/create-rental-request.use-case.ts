import { Injectable, Inject } from '@nestjs/common';
import { IRentalRequestRepository } from '../../domain/repositories/rental-request.repository.interface';
import { RentalRequest } from '../../domain/entities/rental-request.entity';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { v4 as uuidv4 } from 'uuid';
import { Currency, RentalStatus } from '@prisma/client';

export interface CreateRentalRequestCommand {
  customerId: string;
  workspaceId: string;
  vehicleId: string;
  listingId: string;
  startDate: Date;
  endDate: Date;
  dailyRate: number;
  totalAmount: number;
}

@Injectable()
export class CreateRentalRequestUseCase {
  constructor(
    @Inject('IRentalRequestRepository') private repo: IRentalRequestRepository,
  ) {}

  async execute(cmd: CreateRentalRequestCommand): Promise<Result<RentalRequest, AppError>> {
    const rental = RentalRequest.create(uuidv4(), {
      customerId: cmd.customerId,
      workspaceId: cmd.workspaceId,
      vehicleId: cmd.vehicleId,
      listingId: cmd.listingId,
      status: RentalStatus.REQUESTED,
      startDate: cmd.startDate,
      endDate: cmd.endDate,
      dailyRate: cmd.dailyRate,
      currency: Currency.KES,
      totalAmount: cmd.totalAmount,
      depositAmount: null,
      pickupNotes: null,
      rejectionReason: null,
    });

    await this.repo.save(rental);
    return Result.ok(rental);
  }
}