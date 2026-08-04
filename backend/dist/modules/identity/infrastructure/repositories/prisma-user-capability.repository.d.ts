import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IUserCapabilityRepository } from '../../domain/repositories/user-capability.repository.interface';
import { UserCapability } from '../../domain/entities/user-capability.entity';
import { CapabilityType, CapabilityStatus } from '@prisma/client';
export declare class PrismaUserCapabilityRepository implements IUserCapabilityRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toDomain;
    findById(id: string): Promise<UserCapability | null>;
    findByUserAndType(userId: string, type: CapabilityType): Promise<UserCapability | null>;
    findAllByUser(userId: string): Promise<UserCapability[]>;
    findAllByStatus(status: CapabilityStatus): Promise<UserCapability[]>;
    save(cap: UserCapability): Promise<void>;
    delete(id: string): Promise<void>;
}
