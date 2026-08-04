import { IRepository } from '../../../../shared/application/repository.interface';
import { UserCapability } from '../entities/user-capability.entity';
import { CapabilityType, CapabilityStatus } from '@prisma/client';
export declare const USER_CAPABILITY_REPOSITORY = "USER_CAPABILITY_REPOSITORY";
export interface IUserCapabilityRepository extends IRepository<UserCapability> {
    findByUserAndType(userId: string, type: CapabilityType): Promise<UserCapability | null>;
    findAllByUser(userId: string): Promise<UserCapability[]>;
    findAllByStatus(status: CapabilityStatus): Promise<UserCapability[]>;
}
