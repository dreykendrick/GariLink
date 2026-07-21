export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ListingVehicle {
  primaryImageId?: string;
  type?: string;
  bodyType?: string;
  make: string;
  model: string;
  year: number;
  transmission?: string;
  fuelType?: string;
  seats?: number;
}

export interface Listing {
  id: string;
  title: string;
  description?: string;
  currency: string;
  askingPrice: number;
  rentalConfig?: any;
  vehicle: ListingVehicle;
}
