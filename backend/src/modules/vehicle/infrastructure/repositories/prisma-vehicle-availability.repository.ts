import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IVehicleAvailabilityRepository } from '../../domain/repositories/vehicle-availability.repository.interface';
import { VehicleAvailabilityBlock } from '../../domain/entities/vehicle-availability-block.entity';
import { VehicleAvailabilityMapper } from '../persistence/vehicle-availability.mapper';

@Injectable()
export class PrismaVehicleAvailabilityRepository implements IVehicleAvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(block: VehicleAvailabilityBlock): Promise<void> {
    const data = VehicleAvailabilityMapper.toPersistence(block);
    await this.prisma.vehicleAvailabilityBlock.upsert({
      where: { id: block.id },
      update: data,
      create: data,
    });
  }

  async findOverlappingBlocks(vehicleId: string, startDate: Date, endDate: Date): Promise<VehicleAvailabilityBlock[]> {
    const records = await this.prisma.vehicleAvailabilityBlock.findMany({
      where: {
        vehicleId,
        AND: [
          { startDate: { lt: endDate } },
          { endDate: { gt: startDate } }
        ]
      }
    });
    return records.map(r => VehicleAvailabilityMapper.toDomain(r));
  }

  async findByVehicleId(vehicleId: string): Promise<VehicleAvailabilityBlock[]> {
    const records = await this.prisma.vehicleAvailabilityBlock.findMany({
      where: { vehicleId },
      orderBy: { startDate: 'asc' }
    });
    return records.map(r => VehicleAvailabilityMapper.toDomain(r));
  }
}
