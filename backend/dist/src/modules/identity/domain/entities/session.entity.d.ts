import { Entity } from '../../../../shared/domain/entity.base';
export declare class Session extends Entity<string> {
    readonly userId: string;
    readonly deviceId: string | null;
    readonly deviceName: string | null;
    readonly ipAddress: string | null;
    readonly userAgent: string | null;
    isActive: boolean;
    revokedAt: Date | null;
    lastActiveAt: Date;
    constructor(id: string, userId: string, deviceId: string | null, deviceName: string | null, ipAddress: string | null, userAgent: string | null, isActive: boolean, revokedAt: Date | null, lastActiveAt: Date, createdAt?: Date, updatedAt?: Date);
    revoke(): void;
    updateActivity(): void;
    static create(params: {
        id: string;
        userId: string;
        deviceId?: string;
        deviceName?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Session;
}
