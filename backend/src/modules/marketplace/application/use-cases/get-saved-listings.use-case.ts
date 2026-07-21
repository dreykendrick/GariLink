import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { IListingRepository } from '../../domain/repositories/listing.repository.interface';
import { Listing } from '../../domain/entities/listing.entity';

export interface GetSavedListingsDto {
  userId: string;
}

@Injectable()
export class GetSavedListingsUseCase implements IUseCase<GetSavedListingsDto, Result<(Listing & { vehicle?: unknown })[], AppError>> {
  constructor(
    @Inject('IListingRepository')
    private readonly listingRepository: IListingRepository,
  ) {}

  async execute(request: GetSavedListingsDto): Promise<Result<(Listing & { vehicle?: unknown })[], AppError>> {
    const listings = await this.listingRepository.findSavedListings(request.userId);
    return Result.ok(listings);
  }
}
