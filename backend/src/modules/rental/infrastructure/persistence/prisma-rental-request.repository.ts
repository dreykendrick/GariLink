import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IRentalRequestRepository } from '../../domain/repositories/rental-request.repository.interface';
import { RentalRequest } from '../../domain/entities/rental-request.entity';
import { RentalRequestMapper } from './rental-request.mapper';

@Injectable()
export class PrismaRentalRequestRepository implements IRentalRequestRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<RentalRequest | null> {
    const raw = await this.prisma.rentalRequest.findUnique({ where: { id } });
    if (!raw) return null;
    return RentalRequestMapper.toDomain(raw);
  }

  async findByCustomerId(customerId: string): Promise<RentalRequest[]> {
    const raw = await this.prisma.rentalRequest.findMany({ where: { customerId } });
    return raw.map(RentalRequestMapper.toDomain);
  }

  async findByWorkspaceId(workspaceId: string): Promise<RentalRequest[]> {
    const raw = await this.prisma.rentalRequest.findMany({ where: { workspaceId } });
    return raw.map(RentalRequestMapper.toDomain);
  }

  async save(rental: RentalRequest): Promise<void> {
    const data = RentalRequestMapper.toPersistence(rental);
    
    await this.prisma.rentalRequest.upsert({
      where: { id: rental.id },
      update: data,
      create: data,
    });
  }
}