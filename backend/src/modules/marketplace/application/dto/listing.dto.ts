import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum, Min, IsPositive, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ListingType } from '@prisma/client';

export class RentalConfigDto {
  @IsNumber() @IsPositive() dailyRate!: number;
  @IsString() @IsOptional() currency?: string;
  @IsNumber() @Min(0) depositAmount!: number;
  @IsString() @IsNotEmpty() pickupCounty!: string;
  @IsString() @IsNotEmpty() pickupCity!: string;
  @IsString() @IsNotEmpty() fuelPolicy!: string;
  @IsNumber() @Min(1) minimumRentalDays!: number;
}

export class CreateListingDto {
  @IsString() @IsNotEmpty() vehicleId!: string;
  @IsString() @IsNotEmpty() workspaceId!: string;
  @IsEnum(ListingType) type!: ListingType;
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) askingPrice!: number;
  @IsOptional() @IsString() pricingCurrency?: string;
  @IsOptional() @IsBoolean() negotiable?: boolean;
  @IsOptional() @IsNumber() @Min(1) @Type(() => Number) conditionRating?: number;
  @IsOptional() @IsString() conditionNotes?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsString() county?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RentalConfigDto)
  rentalConfig?: RentalConfigDto;
}

export class SearchRentalListingsDto {
  @IsOptional() @Type(() => Number) @IsNumber() page?: number;
  @IsOptional() @Type(() => Number) @IsNumber() limit?: number;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsEnum(ListingType) type?: ListingType;
  @IsOptional() @IsString() county?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() make?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @Type(() => Number) @IsNumber() yearMin?: number;
  @IsOptional() @Type(() => Number) @IsNumber() yearMax?: number;
  @IsOptional() @Type(() => Number) @IsNumber() priceMin?: number;
  @IsOptional() @Type(() => Number) @IsNumber() priceMax?: number;
  @IsOptional() @IsString() sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'mileage';
}
