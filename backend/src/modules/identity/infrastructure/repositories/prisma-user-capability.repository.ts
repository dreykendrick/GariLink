import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IUserCapabilityRepository } from '../../domain/repositories/user-capability.repository.interface';
import { UserCapability } from '../../domain/entities/user-capability.entity';
import {
  CapabilityType,
  CapabilityStatus,
  UserCapability as PrismaCap,
} from '@prisma/client';

@Injectable()
export class PrismaUserCapabilityRepository
  implements IUserCapabilityRepository
{
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(c: PrismaCap): UserCapability {
    return new UserCapability(
      c.id, c.userId, c.type, c.status,
      c.grantedAt, c.expiresAt, c.suspendedAt, c.suspendedReason,
      c.revokedAt, c.revokedReason, c.rejectedAt, c.rejectionReason,
      c.requestedAt, c.createdAt, c.updatedAt,
    );
  }

  async findById(id: string): Promise<UserCapability | null> {
    const r = await this.prisma.userCapability.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findByUserAndType(
    userId: string,
    type: CapabilityType,
  ): Promise<UserCapability | null> {
    const r = await this.prisma.userCapability.findUnique({
      where: { userId_type: { userId, type } },
    });
    return r ? this.toDomain(r) : null;
  }

  async findAllByUser(userId: string): Promise<UserCapability[]> {
    const records = await this.prisma.userCapability.findMany({
      where: { userId },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findAllByStatus(status: CapabilityStatus): Promise<UserCapability[]> {
    const records = await this.prisma.userCapability.findMany({
      where: { status },
    });
    return records.map((r) => this.toDomain(r));
  }

  async save(cap: UserCapability): Promise<void> {
    await this.prisma.userCapability.upsert({
      where: { id: cap.id },
      create: {
        id: cap.id,
        userId: cap.userId,
        type: cap.type,
        status: cap.status,
        grantedAt: cap.grantedAt,
        expiresAt: cap.expiresAt,
        suspendedAt: cap.suspendedAt,
        suspendedReason: cap.suspendedReason,
        revokedAt: cap.revokedAt,
        revokedReason: cap.revokedReason,
        rejectedAt: cap.rejectedAt,
        rejectionReason: cap.rejectionReason,
        requestedAt: cap.requestedAt,
      },
      update: {
        status: cap.status,
        grantedAt: cap.grantedAt,
        expiresAt: cap.expiresAt,
        suspendedAt: cap.suspendedAt,
        suspendedReason: cap.suspendedReason,
        revokedAt: cap.revokedAt,
        revokedReason: cap.revokedReason,
        rejectedAt: cap.rejectedAt,
        rejectionReason: cap.rejectionReason,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.userCapability.delete({ where: { id } });
  }
}
