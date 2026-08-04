import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { ISessionRepository } from '../../domain/repositories/session.repository.interface';
import { Session } from '../../domain/entities/session.entity';
export declare class PrismaSessionRepository implements ISessionRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toDomain;
    findById(id: string): Promise<Session | null>;
    findAllActiveByUserId(userId: string): Promise<Session[]>;
    save(session: Session): Promise<void>;
    delete(id: string): Promise<void>;
    revokeAllByUserId(userId: string): Promise<void>;
}
