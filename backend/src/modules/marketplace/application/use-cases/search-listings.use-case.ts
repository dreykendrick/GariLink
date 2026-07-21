import { Injectable, Inject } from '@nestjs/common';
import { IListingRepository } from '../../domain/repositories/listing.repository.interface';
import { SearchRentalListingsDto } from '../dto/listing.dto';
import { PaginatedResult } from '../../../../shared/application/paginated-result';
import { Listing } from '../../domain/entities/listing.entity';

@Injectable()
export class SearchListingsUseCase {
  constructor(
    @Inject('IListingRepository') private readonly repository: IListingRepository,
  ) {}

  async execute(query: SearchRentalListingsDto): Promise<PaginatedResult<Listing & { vehicle?: unknown }>> {
    return this.repository.search(query);
  }
}
