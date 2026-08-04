import { WorkspaceType, OrganizationMemberRole } from '@prisma/client';
import { Result } from '../../shared/domain/result';
import { AppError } from '../../core/errors/app-error';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { AccessJwtPayload } from '../../core/security/token.service';
declare class CreateOrganizationDto {
    workspaceId: string;
    name: string;
    type: WorkspaceType;
    registrationNumber?: string;
    phoneNumber?: string;
    email?: string;
    website?: string;
    description?: string;
    county?: string;
    city?: string;
}
declare class UpdateOrganizationDto {
    name?: string;
    phoneNumber?: string;
    email?: string;
    website?: string;
    description?: string;
    county?: string;
    type?: WorkspaceType;
}
declare class AddOrgMemberDto {
    userId: string;
    role: OrganizationMemberRole;
}
export declare class OrganizationService {
    private readonly prisma;
    private readonly auditLog;
    constructor(prisma: PrismaService, auditLog: AuditLogService);
    create(input: CreateOrganizationDto & {
        userId: string;
    }): Promise<Result<unknown, AppError>>;
    findById(id: string): Promise<Result<unknown, AppError>>;
    listByWorkspace(workspaceId: string, userId: string): Promise<unknown[]>;
    update(input: {
        orgId: string;
        userId: string;
        fields: Partial<UpdateOrganizationDto>;
    }): Promise<Result<unknown, AppError>>;
    addMember(input: {
        orgId: string;
        requesterId: string;
        userId: string;
        role: OrganizationMemberRole;
    }): Promise<Result<unknown, AppError>>;
}
export declare class OrganizationController {
    private readonly service;
    constructor(service: OrganizationService);
    create(dto: CreateOrganizationDto, user: AccessJwtPayload): Promise<unknown>;
    listByWorkspace(workspaceId: string, user: AccessJwtPayload): Promise<unknown[]>;
    get(id: string): Promise<unknown>;
    update(id: string, dto: UpdateOrganizationDto, user: AccessJwtPayload): Promise<unknown>;
    addMember(id: string, dto: AddOrgMemberDto, user: AccessJwtPayload): Promise<unknown>;
}
export declare class OrganizationModule {
}
export {};
