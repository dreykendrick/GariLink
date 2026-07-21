import { Listing } from '../entities/listing.entity';
import { PaginatedResult } from '../../../../shared/application/paginated-result';
import { ListingType } from '@prisma/client';

export interface ListingSearchParams {
  page?: number;
  limit?: number;
  type?: ListingType;
  county?: string;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: string;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  fuelType?: string;
  bodyType?: string;
  negotiable?: boolean;
}

export interface IListingRepository {
  save(listing: Listing): Promise<void>;
  findById(id: string): Promise<Listing | null>;
  search(params: ListingSearchParams): Promise<PaginatedResult<Listing & { vehicle?: unknown }>>;
  delete(id: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  findMyListings(workspaceId: string, params: any): Promise<PaginatedResult<Listing & { vehicle?: unknown }>>;
  findSavedListings(userId: string): Promise<(Listing & { vehicle?: unknown })[]>;
  toggleFavourite(userId: string, vehicleId: string, action: 'save' | 'remove'): Promise<void>;
}
