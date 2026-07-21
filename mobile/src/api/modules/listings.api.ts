import { api } from '../client';
import type { Listing, PaginatedResponse, Inquiry } from '../../types/api.types';

export interface SearchListingsParams {
  page?: number;
  limit?: number;
  q?: string;
  type?: string;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  fuelType?: string;
  transmissionType?: string;
  bodyType?: string;
  county?: string;
  negotiable?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'mileage';
}

export interface CreateListingInput {
  vehicleId: string;
  workspaceId: string;
  type: string;
  title: string;
  description?: string;
  askingPrice: number;
  pricingCurrency?: string;
  negotiable?: boolean;
  conditionRating?: number;
  conditionNotes?: string;
  tags?: string[];
  county?: string;
}

export const listingsApi = {
  search: (params?: SearchListingsParams) =>
    api.get<PaginatedResponse<Listing>>('/listings', { params }),

  getById: (id: string) =>
    api.get<Listing & { vehicle: unknown }>(`/listings/${id}`),

  getMine: () =>
    api.get<Listing[]>('/listings/mine'),

  getSaved: () =>
    api.get<Array<{ listing: Listing }>>('/listings/saved'),

  create: (data: CreateListingInput) =>
    api.post<Listing>('/listings', data),

  update: (id: string, data: Partial<CreateListingInput>) =>
    api.patch<Listing>(`/listings/${id}`, data),

  publish: (id: string) =>
    api.post<Listing>(`/listings/${id}/publish`),

  pause: (id: string) =>
    api.post<Listing>(`/listings/${id}/pause`),

  archive: (id: string) =>
    api.post<Listing>(`/listings/${id}/archive`),

  restore: (id: string) =>
    api.post<Listing>(`/listings/${id}/restore`),

  updateStatus: (id: string, status: string) =>
    api.patch<Listing>(`/listings/${id}/status`, { status }),

  delete: (id: string) =>
    api.delete<void>(`/listings/${id}`),

  save: (id: string) =>
    api.post<{ saved: boolean }>(`/listings/${id}/save`),

  unsave: (id: string) =>
    api.delete<void>(`/listings/${id}/save`),

  createInquiry: (
    listingId: string,
    data: { message: string; offeredPrice?: number; offerCurrency?: string },
  ) => api.post<Inquiry>(`/listings/${listingId}/inquiries`, data),

  respondToInquiry: (inquiryId: string, decision: string) =>
    api.post<Inquiry>(`/inquiries/${inquiryId}/respond`, { decision }),
};
