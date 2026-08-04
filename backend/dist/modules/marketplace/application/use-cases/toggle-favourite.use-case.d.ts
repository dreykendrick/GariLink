import { IUseCase } from '../../../../shared/application/use-case.interface';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { IListingRepository } from '../../domain/repositories/listing.repository.interface';
export interface ToggleFavouriteDto {
    userId: string;
    listingId: string;
    action: 'save' | 'remove';
}
export declare class ToggleFavouriteUseCase implements IUseCase<ToggleFavouriteDto, Result<void, AppError>> {
    private readonly listingRepository;
    constructor(listingRepository: IListingRepository);
    execute(request: ToggleFavouriteDto): Promise<Result<void, AppError>>;
}
