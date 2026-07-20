import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { RefreshToken as PrismaToken } from '@prisma/client';

@Injectable()
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(t: PrismaToken): RefreshToken {
    return new RefreshToken(
      t.id, t.token, t.userId, t.sessionId, t.familyId,
      t.isRevoked, t.expiresAt, t.replacedByTokenId, t.createdAt,
    );
  }

  async findById(id: string): Promise<RefreshToken | null> {
    const r = await this.prisma.refreshToken.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const r = await this.prisma.refreshToken.findUnique({ where: { token } });
    return r ? this.toDomain(r) : null;
  }

  async save(token: RefreshToken): Promise<void> {
    await this.prisma.refreshToken.upsert({
      where: { id: token.id },
      create: {
        id: token.id,
        token: token.token,
        userId: token.userId,
        sessionId: token.sessionId,
        familyId: token.familyId,
        isRevoked: token.isRevoked,
        expiresAt: token.expiresAt,
        replacedByTokenId: token.replacedByTokenId,
      },
      update: {
        isRevoked: token.isRevoked,
        replacedByTokenId: token.replacedByTokenId,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId },
      data: { isRevoked: true },
    });
  }

  async revokeAllBySessionId(sessionId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { sessionId },
      data: { isRevoked: true },
    });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }
}
