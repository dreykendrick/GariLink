import { Injectable, Inject } from '@nestjs/common';
import { IRentalRequestRepository } from '../../domain/repositories/rental-request.repository.interface';
import { RentalRequest } from '../../domain/entities/rental-request.entity';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';

@Injectable()
export class GetMyRentalRequestsUseCase {
  constructor(
    @Inject('IRentalRequestRepository') private repo: IRentalRequestRepository,
  ) {}

  async execute(customerId: string): Promise<Result<RentalRequest[], AppError>> {
    const rentals = await this.repo.findByCustomerId(customerId);
    return Result.ok(rentals);
  }
}