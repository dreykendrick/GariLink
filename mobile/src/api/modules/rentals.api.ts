import { api } from '../client';
import type { RentalRequest, CreateRentalRequestInput } from '../../types/api.types';

export const rentalsApi = {
  // Customer endpoints
  createRequest: (data: CreateRentalRequestInput) =>
    api.post<RentalRequest>('/rental-requests', data),

  getMyRequests: () =>
    api.get<RentalRequest[]>('/rental-requests/mine'),

  cancelRequest: (id: string) =>
    api.post<RentalRequest>(`/rental-requests/${id}/cancel`),

  // Owner endpoints
  getOwnerRequests: () =>
    api.get<RentalRequest[]>('/owner/rental-requests'),

  approveRequest: (id: string) =>
    api.post<RentalRequest>(`/owner/rental-requests/${id}/approve`),

  rejectRequest: (id: string) =>
    api.post<RentalRequest>(`/owner/rental-requests/${id}/reject`),

  markReadyForPickup: (id: string) =>
    api.post<RentalRequest>(`/owner/rental-requests/${id}/ready`),

  startRental: (id: string) =>
    api.post<RentalRequest>(`/owner/rental-requests/${id}/start`),

  completeRental: (id: string) =>
    api.post<RentalRequest>(`/owner/rental-requests/${id}/complete`),
};
