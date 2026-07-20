import { IRepository } from '../../../../shared/application/repository.interface';
import { RefreshToken } from '../entities/refresh-token.entity';

export const REFRESH_TOKEN_REPOSITORY = 'REFRESH_TOKEN_REPOSITORY';

export interface IRefreshTokenRepository extends IRepository<RefreshToken> {
  findByToken(token: string): Promise<RefreshToken | null>;
  revokeFamily(familyId: string): Promise<void>;
  revokeAllBySessionId(sessionId: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
}
