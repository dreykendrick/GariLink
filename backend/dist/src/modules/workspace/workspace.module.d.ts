import { WorkspaceType, WorkspaceMemberRole } from '@prisma/client';
import { Result } from '../../shared/domain/result';
import { AppError } from '../../core/errors/app-error';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { Workspace, WorkspaceMember } from './domain/entities/workspace.entity';
import { AccessJwtPayload } from '../../core/security/token.service';
declare class CreateWorkspaceDto {
    name: string;
    type: WorkspaceType;
    description?: string;
    slug?: string;
    country?: string;
    currency?: string;
}
declare class UpdateWorkspaceDto {
    name?: string;
    description?: string;
    slug?: string;
}
declare class InviteMemberDto {
    userId: string;
    role: WorkspaceMemberRole;
}
export declare class WorkspaceService {
    private readonly prisma;
    private readonly auditLog;
    constructor(prisma: PrismaService, auditLog: AuditLogService);
    private toWorkspaceDomain;
    createWorkspace(input: {
        ownerId: string;
        name: string;
        type: WorkspaceType;
        description?: string;
        slug?: string;
        country?: string;
    }): Promise<Result<Workspace, AppError>>;
    getWorkspace(id: string, requesterId: string): Promise<Result<Workspace, AppError>>;
    listMyWorkspaces(userId: string): Promise<Workspace[]>;
    updateWorkspace(input: {
        workspaceId: string;
        requesterId: string;
        fields: {
            name?: string;
            description?: string;
            slug?: string;
        };
    }): Promise<Result<Workspace, AppError>>;
    inviteMember(input: {
        workspaceId: string;
        requesterId: string;
        userId: string;
        role: WorkspaceMemberRole;
    }): Promise<Result<WorkspaceMember, AppError>>;
    removeMember(input: {
        workspaceId: string;
        requesterId: string;
        memberId: string;
    }): Promise<Result<void, AppError>>;
    listMembers(workspaceId: string, requesterId: string): Promise<({
        user: {
            id: string;
            email: string | null;
            phoneNumber: string;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.WorkspaceMemberStatus;
        role: import("@prisma/client").$Enums.WorkspaceMemberRole;
        joinedAt: Date;
        invitedBy: string | null;
        workspaceId: string;
    })[]>;
}
export declare class WorkspaceController {
    private readonly service;
    constructor(service: WorkspaceService);
    create(dto: CreateWorkspaceDto, user: AccessJwtPayload): Promise<Workspace>;
    listMine(user: AccessJwtPayload): Promise<Workspace[]>;
    get(id: string, user: AccessJwtPayload): Promise<Workspace>;
    update(id: string, dto: UpdateWorkspaceDto, user: AccessJwtPayload): Promise<Workspace>;
    members(id: string, user: AccessJwtPayload): Promise<({
        user: {
            id: string;
            email: string | null;
            phoneNumber: string;
        };
    } & {
        userId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.WorkspaceMemberStatus;
        role: import("@prisma/client").$Enums.WorkspaceMemberRole;
        joinedAt: Date;
        invitedBy: string | null;
        workspaceId: string;
    })[]>;
    invite(id: string, dto: InviteMemberDto, user: AccessJwtPayload): Promise<WorkspaceMember>;
    remove(id: string, memberId: string, user: AccessJwtPayload): Promise<void>;
}
export declare class WorkspaceModule {
}
export {};
