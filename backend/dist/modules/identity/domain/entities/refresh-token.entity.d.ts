import { Entity } from '../../../../shared/domain/entity.base';
export declare class RefreshToken extends Entity<string> {
    readonly token: string;
    readonly userId: string;
    readonly sessionId: string;
    readonly familyId: string;
    isRevoked: boolean;
    readonly expiresAt: Date;
    replacedByTokenId: string | null;
    constructor(id: string, token: string, userId: string, sessionId: string, familyId: string, isRevoked: boolean, expiresAt: Date, replacedByTokenId: string | null, createdAt?: Date);
    revoke(): void;
    isExpired(): boolean;
    replace(newTokenId: string): void;
    static create(params: {
        id: string;
        token: string;
        userId: string;
        sessionId: string;
        familyId: string;
        expiresAt: Date;
    }): RefreshToken;
}
