import { Entity } from '../../../../shared/domain/entity.base';

export class Session extends Entity<string> {
  constructor(
    id: string,
    public readonly userId: string,
    public readonly deviceId: string | null,
    public readonly deviceName: string | null,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public isActive: boolean,
    public revokedAt: Date | null,
    public lastActiveAt: Date,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
  }

  revoke(): void {
    this.isActive = false;
    this.revokedAt = new Date();
    this.touch();
  }

  updateActivity(): void {
    this.lastActiveAt = new Date();
    this.touch();
  }

  static create(params: {
    id: string;
    userId: string;
    deviceId?: string;
    deviceName?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Session {
    return new Session(
      params.id,
      params.userId,
      params.deviceId ?? null,
      params.deviceName ?? null,
      params.ipAddress ?? null,
      params.userAgent ?? null,
      true,
      null,
      new Date(),
    );
  }
}
