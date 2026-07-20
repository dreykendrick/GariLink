import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { ISessionRepository } from '../../domain/repositories/session.repository.interface';
import { Session } from '../../domain/entities/session.entity';
import { Session as PrismaSession } from '@prisma/client';

@Injectable()
export class PrismaSessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(s: PrismaSession): Session {
    return new Session(
      s.id, s.userId, s.deviceId, s.deviceName, s.ipAddress,
      s.userAgent, s.isActive, s.revokedAt, s.lastActiveAt,
      s.createdAt, s.createdAt,
    );
  }

  async findById(id: string): Promise<Session | null> {
    const r = await this.prisma.session.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findAllActiveByUserId(userId: string): Promise<Session[]> {
    const records = await this.prisma.session.findMany({
      where: { userId, isActive: true },
      orderBy: { lastActiveAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async save(session: Session): Promise<void> {
    await this.prisma.session.upsert({
      where: { id: session.id },
      create: {
        id: session.id,
        userId: session.userId,
        deviceId: session.deviceId,
        deviceName: session.deviceName,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        isActive: session.isActive,
        revokedAt: session.revokedAt,
        lastActiveAt: session.lastActiveAt,
      },
      update: {
        isActive: session.isActive,
        revokedAt: session.revokedAt,
        lastActiveAt: session.lastActiveAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { isActive: false, revokedAt: new Date() },
    });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, revokedAt: new Date() },
    });
  }
}
