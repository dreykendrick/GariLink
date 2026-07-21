import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { Result } from '../../../../shared/domain/result';
import { AppError, NotFoundError } from '../../../../core/errors/app-error';
import { IListingRepository } from '../../domain/repositories/listing.repository.interface';

export interface ToggleFavouriteDto {
  userId: string;
  listingId: string;
  action: 'save' | 'remove';
}

@Injectable()
export class ToggleFavouriteUseCase implements IUseCase<ToggleFavouriteDto, Result<void, AppError>> {
  constructor(
    @Inject('IListingRepository')
    private readonly listingRepository: IListingRepository,
  ) {}

  async execute(request: ToggleFavouriteDto): Promise<Result<void, AppError>> {
    const listing = await this.listingRepository.findById(request.listingId);
    if (!listing || listing.status === 'ARCHIVED') {
      return Result.fail(new NotFoundError('Listing not found'));
    }

    await this.listingRepository.toggleFavourite(request.userId, listing.vehicleId, request.action);

    return Result.ok(undefined);
  }
}
