import { Entity } from '../../../../shared/domain/entity.base';
import { OtpPurpose } from '@prisma/client';
export declare class Otp extends Entity<string> {
    readonly phoneNumber: string;
    readonly userId: string | null;
    readonly purpose: OtpPurpose;
    readonly codeHash: string;
    readonly expiresAt: Date;
    isVerified: boolean;
    attempts: number;
    readonly lastSentAt: Date;
    constructor(id: string, phoneNumber: string, userId: string | null, purpose: OtpPurpose, codeHash: string, expiresAt: Date, isVerified: boolean, attempts: number, lastSentAt: Date, createdAt?: Date);
    isExpired(): boolean;
    isOnCooldown(cooldownSeconds: number): boolean;
    incrementAttempts(): void;
    maxAttemptsReached(max: number): boolean;
    markVerified(): void;
    static generate(id: string, phoneNumber: string, userId: string | null, purpose: OtpPurpose, codeHash: string, expiryMinutes: number): Otp;
}
