import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { Result } from '../../../../shared/domain/result';
import { AppError, NotFoundError } from '../../../../core/errors/app-error';
import { IListingRepository } from '../../domain/repositories/listing.repository.interface';
import { Listing } from '../../domain/entities/listing.entity';

export interface GetListingDto {
  id: string;
}

@Injectable()
export class GetListingUseCase implements IUseCase<GetListingDto, Result<Listing, AppError>> {
  constructor(
    @Inject('IListingRepository')
    private readonly listingRepository: IListingRepository,
  ) {}

  async execute(request: GetListingDto): Promise<Result<Listing, AppError>> {
    const listing = await this.listingRepository.findById(request.id);
    if (!listing || listing.status === 'ARCHIVED') {
      return Result.fail(new NotFoundError('Listing not found'));
    }

    listing.incrementView();
    await this.listingRepository.save(listing);

    return Result.ok(listing);
  }
}
