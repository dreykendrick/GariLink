import { ListingType } from '@prisma/client';
export declare class RentalConfigDto {
    dailyRate: number;
    currency?: string;
    depositAmount: number;
    pickupCounty: string;
    pickupCity: string;
    fuelPolicy: string;
    minimumRentalDays: number;
}
export declare class CreateListingDto {
    vehicleId: string;
    workspaceId: string;
    type: ListingType;
    title: string;
    description?: string;
    askingPrice: number;
    pricingCurrency?: string;
    negotiable?: boolean;
    conditionRating?: number;
    conditionNotes?: string;
    tags?: string[];
    county?: string;
    rentalConfig?: RentalConfigDto;
}
export declare class SearchRentalListingsDto {
    page?: number;
    limit?: number;
    q?: string;
    type?: ListingType;
    county?: string;
    city?: string;
    make?: string;
    model?: string;
    yearMin?: number;
    yearMax?: number;
    priceMin?: number;
    priceMax?: number;
    sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'mileage';
}
