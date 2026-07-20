import { api } from '../client';
import type { Vehicle, PaginatedResponse } from '../../types/api.types';

export interface CreateVehicleInput {
  workspaceId: string;
  make: string;
  model: string;
  year: number;
  variant?: string;
  vin?: string;
  registrationPlate?: string;
  color?: string;
  fuelType?: string;
  transmissionType?: string;
  bodyType?: string;
  engineSizeCC?: number;
  horsePower?: number;
  mileageKm?: number;
  rightHandDrive?: boolean;
  seats?: number;
  doors?: number;
  description?: string;
  features?: string[];
  county?: string;
}

export interface VehicleFilters {
  page?: number;
  limit?: number;
  workspaceId?: string;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  status?: string;
  county?: string;
}

export const vehiclesApi = {
  list: (params?: VehicleFilters) =>
    api.get<PaginatedResponse<Vehicle>>('/vehicles', { params }),

  getById: (id: string) =>
    api.get<Vehicle>(`/vehicles/${id}`),

  create: (data: CreateVehicleInput) =>
    api.post<Vehicle>('/vehicles', data),

  update: (id: string, data: Partial<CreateVehicleInput>) =>
    api.patch<Vehicle>(`/vehicles/${id}`, data),

  retire: (id: string) =>
    api.delete<void>(`/vehicles/${id}`),
};
