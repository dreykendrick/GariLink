import { IRepository } from '../../../../shared/application/repository.interface';
import { User } from '../entities/user.entity';
export declare const USER_REPOSITORY = "USER_REPOSITORY";
export interface IUserRepository extends IRepository<User> {
    findByEmail(email: string): Promise<User | null>;
    findByPhoneNumber(phone: string): Promise<User | null>;
    findByIdentifier(identifier: string): Promise<User | null>;
}
