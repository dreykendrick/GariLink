import { IUseCase } from '../../../../shared/application/use-case.interface';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { IListingRepository } from '../../domain/repositories/listing.repository.interface';
import { Listing } from '../../domain/entities/listing.entity';
export interface GetListingDto {
    id: string;
}
export declare class GetListingUseCase implements IUseCase<GetListingDto, Result<Listing, AppError>> {
    private readonly listingRepository;
    constructor(listingRepository: IListingRepository);
    execute(request: GetListingDto): Promise<Result<Listing, AppError>>;
}
