import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IProfileRepository } from '../../domain/repositories/profile.repository.interface';
import { Profile } from '../../domain/entities/profile.entity';
export declare class PrismaProfileRepository implements IProfileRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toDomain;
    findById(id: string): Promise<Profile | null>;
    findByUserId(userId: string): Promise<Profile | null>;
    save(profile: Profile): Promise<void>;
    delete(id: string): Promise<void>;
}
