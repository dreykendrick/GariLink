import { Entity } from '../../../../shared/domain/entity.base';

export class RefreshToken extends Entity<string> {
  constructor(
    id: string,
    public readonly token: string,
    public readonly userId: string,
    public readonly sessionId: string,
    public readonly familyId: string,
    public isRevoked: boolean,
    public readonly expiresAt: Date,
    public replacedByTokenId: string | null,
    createdAt?: Date,
  ) {
    super(id, createdAt, createdAt);
  }

  revoke(): void {
    this.isRevoked = true;
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  replace(newTokenId: string): void {
    this.isRevoked = true;
    this.replacedByTokenId = newTokenId;
  }

  static create(params: {
    id: string;
    token: string;
    userId: string;
    sessionId: string;
    familyId: string;
    expiresAt: Date;
  }): RefreshToken {
    return new RefreshToken(
      params.id,
      params.token,
      params.userId,
      params.sessionId,
      params.familyId,
      false,
      params.expiresAt,
      null,
    );
  }
}
