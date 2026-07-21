import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { BlockType } from '@prisma/client';

export class BlockVehicleDatesDto {
  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty({ enum: BlockType })
  @IsEnum(BlockType)
  type: BlockType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
