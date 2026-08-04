import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
export declare class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toDomain;
    findById(id: string): Promise<RefreshToken | null>;
    findByToken(token: string): Promise<RefreshToken | null>;
    save(token: RefreshToken): Promise<void>;
    delete(id: string): Promise<void>;
    revokeFamily(familyId: string): Promise<void>;
    revokeAllBySessionId(sessionId: string): Promise<void>;
    revokeAllByUserId(userId: string): Promise<void>;
}
