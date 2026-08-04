import { IListingRepository } from '../../domain/repositories/listing.repository.interface';
import { SearchRentalListingsDto } from '../dto/listing.dto';
import { PaginatedResult } from '../../../../shared/application/paginated-result';
import { Listing } from '../../domain/entities/listing.entity';
export declare class SearchListingsUseCase {
    private readonly repository;
    constructor(repository: IListingRepository);
    execute(query: SearchRentalListingsDto): Promise<PaginatedResult<Listing & {
        vehicle?: unknown;
    }>>;
}
