import { Injectable, Inject } from '@nestjs/common';
import { IRentalRequestRepository } from '../../domain/repositories/rental-request.repository.interface';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { RentalNotFoundError, RentalAccessDeniedError, InvalidRentalTransitionError } from '../../domain/errors/rental.errors';

export interface CancelRentalRequestCommand {
  customerId: string;
  rentalId: string;
}

@Injectable()
export class CancelRentalRequestUseCase {
  constructor(
    @Inject('IRentalRequestRepository') private repo: IRentalRequestRepository,
  ) {}

  async execute(cmd: CancelRentalRequestCommand): Promise<Result<void, AppError>> {
    const rental = await this.repo.findById(cmd.rentalId);
    if (!rental) return Result.fail(new RentalNotFoundError());
    if (rental.customerId !== cmd.customerId) return Result.fail(new RentalAccessDeniedError());

    try {
      rental.cancel();
    } catch (err) {
      return Result.fail(new InvalidRentalTransitionError());
    }

    await this.repo.save(rental);
    return Result.ok(undefined);
  }
}