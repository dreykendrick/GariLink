import { IListingRepository, ListingSearchParams } from '../../domain/repositories/listing.repository.interface';
import { Listing } from '../../domain/entities/listing.entity';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { PaginatedResult } from '../../../../shared/application/paginated-result';
export declare class PrismaListingRepository implements IListingRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    save(listing: Listing): Promise<void>;
    findById(id: string): Promise<Listing | null>;
    search(params: ListingSearchParams): Promise<PaginatedResult<Listing & {
        vehicle?: unknown;
    }>>;
    delete(id: string): Promise<void>;
    softDelete(id: string): Promise<void>;
    findMyListings(workspaceId: string, params: any): Promise<PaginatedResult<Listing & {
        vehicle?: unknown;
    }>>;
    findSavedListings(userId: string): Promise<(Listing & {
        vehicle?: unknown;
    })[]>;
    toggleFavourite(userId: string, vehicleId: string, action: 'save' | 'remove'): Promise<void>;
}
