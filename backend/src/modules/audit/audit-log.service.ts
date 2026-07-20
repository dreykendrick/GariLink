import { Injectable } from '@nestjs/common';
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

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({ data: { ...params, metadata: params.metadata as any } });
    } catch (error) {
      // Never throw from audit log — log to console and continue
      console.error('[AuditLog] Failed to write audit log:', error);
    }
  }
}
