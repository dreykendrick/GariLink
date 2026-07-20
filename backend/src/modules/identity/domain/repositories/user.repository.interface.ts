import { IRepository } from '../../../../shared/application/repository.interface';
import { User } from '../entities/user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository extends IRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findByPhoneNumber(phone: string): Promise<User | null>;
  /** Finds by email or phone number */
  findByIdentifier(identifier: string): Promise<User | null>;
}
