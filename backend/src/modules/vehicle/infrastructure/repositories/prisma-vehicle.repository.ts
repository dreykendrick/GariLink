import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { VehicleMapper } from '../persistence/vehicle.mapper';

@Injectable()
export class PrismaVehicleRepository implements IVehicleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Vehicle | null> {
    const record = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!record) return null;
    return VehicleMapper.toDomain(record as any);
  }

  async findByVin(vin: string): Promise<Vehicle | null> {
    const record = await this.prisma.vehicle.findUnique({ where: { vin } });
    if (!record) return null;
    return VehicleMapper.toDomain(record as any);
  }

  async findByRegistrationNumber(registrationNumber: string): Promise<Vehicle | null> {
    const record = await this.prisma.vehicle.findUnique({ where: { registrationNumber } });
    if (!record) return null;
    return VehicleMapper.toDomain(record as any);
  }

  async findByWorkspaceId(workspaceId: string, limit: number, offset: number): Promise<{ data: Vehicle[]; total: number }> {
    const [records, total] = await this.prisma.$transaction([
      this.prisma.vehicle.findMany({
        where: { workspaceId },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vehicle.count({ where: { workspaceId } }),
    ]);

    return {
      data: records.map(r => VehicleMapper.toDomain(r as any)),
      total,
    };
  }

  async save(vehicle: Vehicle): Promise<void> {
    const data = VehicleMapper.toPersistence(vehicle);
    await this.prisma.vehicle.upsert({
      where: { id: vehicle.id },
      update: data,
      create: data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.vehicle.delete({ where: { id } });
  }

  async findAll(limit: number, offset: number): Promise<{ data: Vehicle[]; total: number }> {
    const [records, total] = await this.prisma.$transaction([
      this.prisma.vehicle.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vehicle.count(),
    ]);

    return {
      data: records.map(r => VehicleMapper.toDomain(r as any)),
      total,
    };
  }
}
