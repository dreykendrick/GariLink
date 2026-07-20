import { Entity } from '../../../../shared/domain/entity.base';
import { CapabilityType, CapabilityStatus } from '@prisma/client';

export class UserCapability extends Entity<string> {
  constructor(
    id: string,
    public readonly userId: string,
    public readonly type: CapabilityType,
    public status: CapabilityStatus,
    public grantedAt: Date | null,
    public expiresAt: Date | null,
    public suspendedAt: Date | null,
    public suspendedReason: string | null,
    public revokedAt: Date | null,
    public revokedReason: string | null,
    public rejectedAt: Date | null,
    public rejectionReason: string | null,
    public readonly requestedAt: Date,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
  }

  approve(): void {
    this.status = CapabilityStatus.ACTIVE;
    this.grantedAt = new Date();
    this.touch();
  }

  reject(reason: string): void {
    this.status = CapabilityStatus.REJECTED;
    this.rejectedAt = new Date();
    this.rejectionReason = reason;
    this.touch();
  }

  suspend(reason: string): void {
    this.status = CapabilityStatus.SUSPENDED;
    this.suspendedAt = new Date();
    this.suspendedReason = reason;
    this.touch();
  }

  reactivate(): void {
    this.status = CapabilityStatus.ACTIVE;
    this.suspendedAt = null;
    this.suspendedReason = null;
    this.touch();
  }

  revoke(reason: string): void {
    this.status = CapabilityStatus.REVOKED;
    this.revokedAt = new Date();
    this.revokedReason = reason;
    this.touch();
  }

  isActive(): boolean {
    return this.status === CapabilityStatus.ACTIVE &&
      (this.expiresAt === null || this.expiresAt > new Date());
  }

  static create(id: string, userId: string, type: CapabilityType): UserCapability {
    return new UserCapability(
      id, userId, type, CapabilityStatus.PENDING,
      null, null, null, null, null, null, null, null, new Date(),
    );
  }
}
