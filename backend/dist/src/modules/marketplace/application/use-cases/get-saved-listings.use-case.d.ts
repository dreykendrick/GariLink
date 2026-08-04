import { IUseCase } from '../../../../shared/application/use-case.interface';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { IListingRepository } from '../../domain/repositories/listing.repository.interface';
import { Listing } from '../../domain/entities/listing.entity';
export interface GetSavedListingsDto {
    userId: string;
}
export declare class GetSavedListingsUseCase implements IUseCase<GetSavedListingsDto, Result<(Listing & {
    vehicle?: unknown;
})[], AppError>> {
    private readonly listingRepository;
    constructor(listingRepository: IListingRepository);
    execute(request: GetSavedListingsDto): Promise<Result<(Listing & {
        vehicle?: unknown;
    })[], AppError>>;
}
