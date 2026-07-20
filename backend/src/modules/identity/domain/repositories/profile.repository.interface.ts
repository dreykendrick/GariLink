import { IRepository } from '../../../../shared/application/repository.interface';
import { Profile } from '../entities/profile.entity';

export const PROFILE_REPOSITORY = 'PROFILE_REPOSITORY';

export interface IProfileRepository extends IRepository<Profile> {
  findByUserId(userId: string): Promise<Profile | null>;
}
