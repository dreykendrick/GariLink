import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IOtpRepository } from '../../domain/repositories/otp.repository.interface';
import { Otp } from '../../domain/entities/otp.entity';
import { OtpPurpose, Otp as PrismaOtp } from '@prisma/client';

@Injectable()
export class PrismaOtpRepository implements IOtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(o: PrismaOtp): Otp {
    return new Otp(
      o.id, o.phoneNumber, o.userId, o.purpose,
      o.codeHash, o.expiresAt, o.isVerified, o.attempts, o.lastSentAt, o.createdAt,
    );
  }

  async findById(id: string): Promise<Otp | null> {
    const r = await this.prisma.otp.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findLatestByPhoneAndPurpose(
    phoneNumber: string,
    purpose: OtpPurpose,
  ): Promise<Otp | null> {
    const r = await this.prisma.otp.findFirst({
      where: { phoneNumber, purpose },
      orderBy: { createdAt: 'desc' },
    });
    return r ? this.toDomain(r) : null;
  }

  async findLatestByUserAndPurpose(
    userId: string,
    purpose: OtpPurpose,
  ): Promise<Otp | null> {
    const r = await this.prisma.otp.findFirst({
      where: { userId, purpose },
      orderBy: { createdAt: 'desc' },
    });
    return r ? this.toDomain(r) : null;
  }

  async save(otp: Otp): Promise<void> {
    await this.prisma.otp.upsert({
      where: { id: otp.id },
      create: {
        id: otp.id,
        phoneNumber: otp.phoneNumber,
        userId: otp.userId,
        purpose: otp.purpose,
        codeHash: otp.codeHash,
        expiresAt: otp.expiresAt,
        isVerified: otp.isVerified,
        attempts: otp.attempts,
        lastSentAt: otp.lastSentAt,
      },
      update: {
        isVerified: otp.isVerified,
        attempts: otp.attempts,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.otp.delete({ where: { id } });
  }

  async invalidateAllByPhoneAndPurpose(
    phoneNumber: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    await this.prisma.otp.updateMany({
      where: { phoneNumber, purpose, isVerified: false },
      data: { isVerified: true }, // mark as used so they can't be replayed
    });
  }
}
