import { IRepository } from '../../../../shared/application/repository.interface';
import { Session } from '../entities/session.entity';

export const SESSION_REPOSITORY = 'SESSION_REPOSITORY';

export interface ISessionRepository extends IRepository<Session> {
  findAllActiveByUserId(userId: string): Promise<Session[]>;
  revokeAllByUserId(userId: string): Promise<void>;
}
