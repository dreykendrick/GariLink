import { Entity } from '../../../../shared/domain/entity.base';
import { CapabilityType, CapabilityStatus } from '@prisma/client';
export declare class UserCapability extends Entity<string> {
    readonly userId: string;
    readonly type: CapabilityType;
    status: CapabilityStatus;
    grantedAt: Date | null;
    expiresAt: Date | null;
    suspendedAt: Date | null;
    suspendedReason: string | null;
    revokedAt: Date | null;
    revokedReason: string | null;
    rejectedAt: Date | null;
    rejectionReason: string | null;
    readonly requestedAt: Date;
    constructor(id: string, userId: string, type: CapabilityType, status: CapabilityStatus, grantedAt: Date | null, expiresAt: Date | null, suspendedAt: Date | null, suspendedReason: string | null, revokedAt: Date | null, revokedReason: string | null, rejectedAt: Date | null, rejectionReason: string | null, requestedAt: Date, createdAt?: Date, updatedAt?: Date);
    approve(): void;
    reject(reason: string): void;
    suspend(reason: string): void;
    reactivate(): void;
    revoke(reason: string): void;
    isActive(): boolean;
    static create(id: string, userId: string, type: CapabilityType): UserCapability;
}
