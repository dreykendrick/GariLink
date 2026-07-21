import { api } from '../../../api/client';
import { Listing, PaginatedResponse } from '../domain/listing.types';

export const listingService = {
  searchListings: (params?: Record<string, any>): Promise<PaginatedResponse<Listing>> => {
    return api.get<PaginatedResponse<Listing>>('/listings', { params });
  },

  getListing: (id: string): Promise<Listing> => {
    return api.get<Listing>(`/listings/${id}`);
  },

  getSavedListings: (): Promise<Listing[]> => {
    return api.get<Listing[]>('/listings/saved');
  },

  saveListing: (id: string): Promise<void> => {
    return api.post<void>(`/listings/${id}/save`);
  },

  removeSavedListing: (id: string): Promise<void> => {
    return api.delete<void>(`/listings/${id}/save`);
  },
};
