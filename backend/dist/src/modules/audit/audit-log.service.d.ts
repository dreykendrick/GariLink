import { PrismaService } from '../../shared/infrastructure/prisma.service';
export interface AuditLogParams {
    action: string;
    actorId: string;
    subjectType: string;
    subjectId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}
export declare class AuditLogService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(params: AuditLogParams): Promise<void>;
}
