import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsEnum, Min, Max 
} from 'class-validator';
import { Type } from 'class-transformer';
import { 
  VehicleStatus, FuelType, Transmission, BodyType, VehicleType, 
  Drivetrain, VehicleCondition 
} from '@prisma/client';

export class CreateVehicleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;

  @ApiProperty({ enum: VehicleType })
  @IsEnum(VehicleType)
  type!: VehicleType;

  @ApiProperty({ enum: BodyType })
  @IsEnum(BodyType)
  bodyType!: BodyType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  make!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  model!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trim?: string;

  @ApiProperty({ enum: FuelType })
  @IsEnum(FuelType)
  fuelType!: FuelType;

  @ApiProperty({ enum: Transmission })
  @IsEnum(Transmission)
  transmission!: Transmission;

  @ApiProperty({ enum: Drivetrain })
  @IsEnum(Drivetrain)
  drivetrain!: Drivetrain;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  engineCapacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  engineNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  horsepower?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  torque?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fuelTankCapacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  groundClearance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  wheelbase?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  doors?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  seats?: number;

  @ApiProperty({ enum: VehicleCondition })
  @IsEnum(VehicleCondition)
  condition!: VehicleCondition;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  mileage!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exteriorColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interiorColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryImageId?: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;

  @ApiPropertyOptional({ enum: BodyType })
  @IsOptional()
  @IsEnum(BodyType)
  bodyType?: BodyType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trim?: string;

  @ApiPropertyOptional({ enum: FuelType })
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @ApiPropertyOptional({ enum: Transmission })
  @IsOptional()
  @IsEnum(Transmission)
  transmission?: Transmission;

  @ApiPropertyOptional({ enum: Drivetrain })
  @IsOptional()
  @IsEnum(Drivetrain)
  drivetrain?: Drivetrain;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  engineCapacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  engineNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  horsepower?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  torque?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fuelTankCapacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  groundClearance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  wheelbase?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  doors?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  seats?: number;

  @ApiPropertyOptional({ enum: VehicleCondition })
  @IsOptional()
  @IsEnum(VehicleCondition)
  condition?: VehicleCondition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  mileage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exteriorColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interiorColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryImageId?: string;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}

export class VehicleQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  yearMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  yearMax?: number;

  @ApiPropertyOptional({ enum: FuelType })
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @ApiPropertyOptional({ enum: Transmission })
  @IsOptional()
  @IsEnum(Transmission)
  transmission?: Transmission;

  @ApiPropertyOptional({ enum: BodyType })
  @IsOptional()
  @IsEnum(BodyType)
  bodyType?: BodyType;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}
