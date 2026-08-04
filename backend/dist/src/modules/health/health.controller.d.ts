import { PrismaService } from '../../shared/infrastructure/prisma.service';
export declare class HealthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    check(): Promise<{
        status: string;
        uptime: number;
        timestamp: string;
        checks: {
            database: string;
        };
    }>;
}
