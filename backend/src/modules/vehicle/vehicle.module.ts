import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  Controller, Post, Get, Patch, Delete, Body, Param,
  Query, HttpCode, HttpStatus, Module,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean,
  IsArray, IsEnum, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  VehicleStatus, FuelType, Transmission, BodyType, VehicleCategory,
  Drivetrain, VehicleCondition, WorkspaceMemberRole, Prisma,
} from '@prisma/client';

import { Result } from '../../shared/domain/result';
import { AppError } from '../../core/errors/app-error';
import { PaginatedResult } from '../../shared/application/paginated-result';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CurrentUser } from '../../core/security/decorators/current-user.decorator';
import { AccessJwtPayload } from '../../core/security/token.service';
import { Vehicle, VehicleProps } from './domain/entities/vehicle.entity';
import {
  VehicleNotFoundError,
  VehicleAccessDeniedError,
} from './domain/errors/vehicle.errors';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class CreateVehicleDto {
  @IsString() @IsNotEmpty() workspaceId!: string;
  @IsEnum(VehicleCategory) category!: VehicleCategory;
  @IsEnum(BodyType) bodyType!: BodyType;
  @IsString() @IsNotEmpty() make!: string;
  @IsString() @IsNotEmpty() model!: string;
  @IsNumber() @Min(1900) @Max(new Date().getFullYear() + 1) year!: number;
  @IsOptional() @IsString() trim?: string;
  @IsEnum(FuelType) fuelType!: FuelType;
  @IsEnum(Transmission) transmission!: Transmission;
  @IsEnum(Drivetrain) drivetrain!: Drivetrain;
  @IsOptional() @IsNumber() engineCapacity?: number;
  @IsOptional() @IsNumber() doors?: number;
  @IsOptional() @IsNumber() seats?: number;
  @IsEnum(VehicleCondition) condition!: VehicleCondition;
  @IsNumber() @Min(0) mileage!: number;
  @IsOptional() @IsString() exteriorColor?: string;
  @IsOptional() @IsString() interiorColor?: string;
  @IsOptional() @IsString() vin?: string;
  @IsOptional() @IsString() registrationNumber?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
  @IsOptional() @IsString() description?: string;
}

class UpdateVehicleDto {
  @IsOptional() @IsEnum(VehicleCategory) category?: VehicleCategory;
  @IsOptional() @IsEnum(BodyType) bodyType?: BodyType;
  @IsOptional() @IsString() make?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsNumber() year?: number;
  @IsOptional() @IsString() trim?: string;
  @IsOptional() @IsEnum(FuelType) fuelType?: FuelType;
  @IsOptional() @IsEnum(Transmission) transmission?: Transmission;
  @IsOptional() @IsEnum(Drivetrain) drivetrain?: Drivetrain;
  @IsOptional() @IsNumber() engineCapacity?: number;
  @IsOptional() @IsNumber() doors?: number;
  @IsOptional() @IsNumber() seats?: number;
  @IsOptional() @IsEnum(VehicleCondition) condition?: VehicleCondition;
  @IsOptional() @IsNumber() mileage?: number;
  @IsOptional() @IsString() exteriorColor?: string;
  @IsOptional() @IsString() interiorColor?: string;
  @IsOptional() @IsString() vin?: string;
  @IsOptional() @IsString() registrationNumber?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(VehicleStatus) status?: VehicleStatus;
}

class VehicleQueryDto {
  @IsOptional() @Type(() => Number) @IsNumber() page?: number;
  @IsOptional() @Type(() => Number) @IsNumber() limit?: number;
  @IsOptional() @IsString() workspaceId?: string;
  @IsOptional() @IsString() make?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @Type(() => Number) @IsNumber() yearMin?: number;
  @IsOptional() @Type(() => Number) @IsNumber() yearMax?: number;
  @IsOptional() @IsEnum(FuelType) fuelType?: FuelType;
  @IsOptional() @IsEnum(Transmission) transmission?: Transmission;
  @IsOptional() @IsEnum(BodyType) bodyType?: BodyType;
  @IsOptional() @IsEnum(VehicleStatus) status?: VehicleStatus;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class VehicleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private toDomain(r: Prisma.VehicleGetPayload<object>): Vehicle {
    return Vehicle.create(r.id, {
      workspaceId: r.workspaceId,
      category: r.category,
      bodyType: r.bodyType,
      make: r.make,
      model: r.model,
      year: r.year,
      trim: r.trim,
      fuelType: r.fuelType,
      transmission: r.transmission,
      drivetrain: r.drivetrain,
      engineCapacity: r.engineCapacity,
      doors: r.doors,
      seats: r.seats,
      condition: r.condition,
      mileage: r.mileage,
      exteriorColor: r.exteriorColor,
      interiorColor: r.interiorColor,
      vin: r.vin,
      registrationNumber: r.registrationNumber,
      features: r.features as string[],
      description: r.description,
      status: r.status,
      isVerified: r.isVerified,
      geofenceEnabled: r.geofenceEnabled,
    });
  }

  private async assertWorkspaceAccess(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        status: 'ACTIVE',
        role: { in: [WorkspaceMemberRole.OWNER, WorkspaceMemberRole.MANAGER] },
      },
    });
    if (!member) throw new VehicleAccessDeniedError();
  }

  async create(
    input: CreateVehicleDto & { userId: string },
  ): Promise<Result<Vehicle, AppError>> {
    try {
      await this.assertWorkspaceAccess(input.workspaceId, input.userId);

      const id = uuidv4();
      const record = await this.prisma.vehicle.create({
        data: {
          id,
          workspaceId: input.workspaceId,
          category: input.category,
          bodyType: input.bodyType,
          make: input.make,
          model: input.model,
          year: input.year,
          trim: input.trim ?? null,
          fuelType: input.fuelType,
          transmission: input.transmission,
          drivetrain: input.drivetrain,
          engineCapacity: input.engineCapacity ?? null,
          doors: input.doors ?? null,
          seats: input.seats ?? null,
          condition: input.condition,
          mileage: input.mileage,
          exteriorColor: input.exteriorColor ?? null,
          interiorColor: input.interiorColor ?? null,
          vin: input.vin ?? null,
          registrationNumber: input.registrationNumber ?? null,
          features: input.features ?? [],
          description: input.description ?? null,
          status: VehicleStatus.AVAILABLE,
        },
      });

      await this.auditLog.log({
        action: 'vehicle.created',
        actorId: input.userId,
        subjectType: 'Vehicle',
        subjectId: id,
        metadata: { workspaceId: input.workspaceId, make: input.make, model: input.model },
      });

      return Result.ok(this.toDomain(record));
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }

  async findById(id: string): Promise<Result<Vehicle, AppError>> {
    const record = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!record) return Result.fail(new VehicleNotFoundError());
    return Result.ok(this.toDomain(record));
  }

  async update(input: {
    vehicleId: string;
    userId: string;
    fields: Partial<VehicleProps>;
  }): Promise<Result<Vehicle, AppError>> {
    try {
      const record = await this.prisma.vehicle.findUnique({
        where: { id: input.vehicleId },
      });
      if (!record) return Result.fail(new VehicleNotFoundError());
      await this.assertWorkspaceAccess(record.workspaceId, input.userId);

      const updated = await this.prisma.vehicle.update({
        where: { id: input.vehicleId },
        data: { ...input.fields, updatedAt: new Date() },
      });
      return Result.ok(this.toDomain(updated));
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }

  async list(query: VehicleQueryDto, userId: string): Promise<PaginatedResult<Vehicle>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, query.limit ?? 20);
    const skip = (page - 1) * limit;

    const where: Prisma.VehicleWhereInput = {};
    if (query.workspaceId) where.workspaceId = query.workspaceId;
    if (query.make) where.make = { contains: query.make, mode: 'insensitive' };
    if (query.model) where.model = { contains: query.model, mode: 'insensitive' };
    if (query.fuelType) where.fuelType = query.fuelType;
    if (query.transmission) where.transmission = query.transmission;
    if (query.bodyType) where.bodyType = query.bodyType;
    if (query.status) where.status = query.status;
    if (query.yearMin || query.yearMax) {
      where.year = {};
      if (query.yearMin) (where.year as Record<string, number>).gte = query.yearMin;
      if (query.yearMax) (where.year as Record<string, number>).lte = query.yearMax;
    }

    const [records, total] = await this.prisma.$transaction([
      this.prisma.vehicle.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.vehicle.count({ where }),
    ]);

    return PaginatedResult.of(records.map((r) => this.toDomain(r)), page, limit, total);
  }

  async delete(vehicleId: string, userId: string): Promise<Result<void, AppError>> {
    try {
      const record = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!record) return Result.fail(new VehicleNotFoundError());
      await this.assertWorkspaceAccess(record.workspaceId, userId);
      await this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: VehicleStatus.SCRAPPED },
      });
      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }
}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly service: VehicleService) {}

  @Post()
  @ApiOperation({ summary: 'Add a vehicle to a workspace' })
  async create(@Body() dto: CreateVehicleDto, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.service.create({ ...dto, userId: user.userId });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Get()
  @ApiOperation({ summary: 'List vehicles (with filters)' })
  async list(@Query() query: VehicleQueryDto, @CurrentUser() user: AccessJwtPayload) {
    return this.service.list(query, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle details' })
  async get(@Param('id') id: string) {
    const result = await this.service.findById(id);
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() user: AccessJwtPayload,
  ) {
    const result = await this.service.update({
      vehicleId: id,
      userId: user.userId,
      fields: dto as Partial<VehicleProps>,
    });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retire (soft delete) a vehicle' })
  async delete(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.service.delete(id, user.userId);
    if (result.isFail) throw result.error;
  }
}

// ─── Module ───────────────────────────────────────────────────────────────────

@Module({
  controllers: [VehicleController],
  providers: [VehicleService],
  exports: [VehicleService],
})
export class VehicleModule {}
