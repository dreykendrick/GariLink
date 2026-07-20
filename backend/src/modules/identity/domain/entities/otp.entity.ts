import { Entity } from '../../../../shared/domain/entity.base';
import { OtpPurpose } from '@prisma/client';

export class Otp extends Entity<string> {
  constructor(
    id: string,
    public readonly phoneNumber: string,
    public readonly userId: string | null,
    public readonly purpose: OtpPurpose,
    public readonly codeHash: string,
    public readonly expiresAt: Date,
    public isVerified: boolean,
    public attempts: number,
    public readonly lastSentAt: Date,
    createdAt?: Date,
  ) {
    super(id, createdAt, createdAt);
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  isOnCooldown(cooldownSeconds: number): boolean {
    const cooldownMs = cooldownSeconds * 1000;
    return Date.now() - this.lastSentAt.getTime() < cooldownMs;
  }

  incrementAttempts(): void {
    this.attempts += 1;
  }

  maxAttemptsReached(max: number): boolean {
    return this.attempts >= max;
  }

  markVerified(): void {
    this.isVerified = true;
  }

  static generate(
    id: string,
    phoneNumber: string,
    userId: string | null,
    purpose: OtpPurpose,
    codeHash: string,
    expiryMinutes: number,
  ): Otp {
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    return new Otp(id, phoneNumber, userId, purpose, codeHash, expiresAt, false, 0, new Date());
  }
}
