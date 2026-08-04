"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceModule = exports.WorkspaceController = exports.WorkspaceService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const result_1 = require("../../shared/domain/result");
const app_error_1 = require("../../core/errors/app-error");
const prisma_service_1 = require("../../shared/infrastructure/prisma.service");
const audit_log_service_1 = require("../audit/audit-log.service");
const workspace_entity_1 = require("./domain/entities/workspace.entity");
const workspace_errors_1 = require("./domain/errors/workspace.errors");
const class_validator_1 = require("class-validator");
const common_2 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../core/security/decorators/current-user.decorator");
class CreateWorkspaceDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateWorkspaceDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.WorkspaceType),
    __metadata("design:type", String)
], CreateWorkspaceDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkspaceDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkspaceDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkspaceDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkspaceDto.prototype, "currency", void 0);
class UpdateWorkspaceDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWorkspaceDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWorkspaceDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWorkspaceDto.prototype, "slug", void 0);
class InviteMemberDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.WorkspaceMemberRole),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "role", void 0);
class UpdateMemberRoleDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(client_1.WorkspaceMemberRole),
    __metadata("design:type", String)
], UpdateMemberRoleDto.prototype, "role", void 0);
let WorkspaceService = class WorkspaceService {
    constructor(prisma, auditLog) {
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    toWorkspaceDomain(r) {
        return new workspace_entity_1.Workspace(r.id, {
            name: r.name, type: r.type, ownerId: r.ownerId, slug: r.slug,
            description: r.description, logoUrl: r.logoUrl ?? null, isVerified: r.isVerified,
            isActive: r.isActive, country: r.country,
        }, r.createdAt, r.updatedAt);
    }
    async createWorkspace(input) {
        try {
            const id = (0, uuid_1.v4)();
            const record = await this.prisma.workspace.create({
                data: {
                    id,
                    name: input.name,
                    type: input.type,
                    ownerId: input.ownerId,
                    slug: input.slug ?? input.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                    description: input.description ?? null,
                    country: input.country ?? 'KE',
                    members: {
                        create: {
                            id: (0, uuid_1.v4)(),
                            userId: input.ownerId,
                            role: client_1.WorkspaceMemberRole.OWNER,
                            joinedAt: new Date(),
                        },
                    },
                },
            });
            await this.auditLog.log({
                action: 'workspace.created',
                actorId: input.ownerId,
                subjectType: 'Workspace',
                subjectId: id,
            });
            return result_1.Result.ok(this.toWorkspaceDomain(record));
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
    async getWorkspace(id, requesterId) {
        const record = await this.prisma.workspace.findUnique({ where: { id } });
        if (!record)
            return result_1.Result.fail(new workspace_errors_1.WorkspaceNotFoundError());
        const member = await this.prisma.workspaceMember.findFirst({
            where: { workspaceId: id, userId: requesterId, status: 'ACTIVE' },
        });
        if (!member)
            return result_1.Result.fail(new workspace_errors_1.WorkspaceAccessDeniedError());
        return result_1.Result.ok(this.toWorkspaceDomain(record));
    }
    async listMyWorkspaces(userId) {
        const memberships = await this.prisma.workspaceMember.findMany({
            where: { userId, status: 'ACTIVE' },
            include: { workspace: true },
            orderBy: { joinedAt: 'desc' },
        });
        return memberships.map((m) => this.toWorkspaceDomain(m.workspace));
    }
    async updateWorkspace(input) {
        try {
            const member = await this.prisma.workspaceMember.findFirst({
                where: {
                    workspaceId: input.workspaceId,
                    userId: input.requesterId,
                    status: 'ACTIVE',
                    role: { in: [client_1.WorkspaceMemberRole.OWNER, client_1.WorkspaceMemberRole.MANAGER] },
                },
            });
            if (!member)
                return result_1.Result.fail(new workspace_errors_1.WorkspaceAccessDeniedError());
            const updated = await this.prisma.workspace.update({
                where: { id: input.workspaceId },
                data: input.fields,
            });
            return result_1.Result.ok(this.toWorkspaceDomain(updated));
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
    async inviteMember(input) {
        try {
            const requester = await this.prisma.workspaceMember.findFirst({
                where: {
                    workspaceId: input.workspaceId,
                    userId: input.requesterId,
                    status: 'ACTIVE',
                    role: { in: [client_1.WorkspaceMemberRole.OWNER, client_1.WorkspaceMemberRole.MANAGER] },
                },
            });
            if (!requester)
                return result_1.Result.fail(new workspace_errors_1.WorkspaceAccessDeniedError());
            const existing = await this.prisma.workspaceMember.findFirst({
                where: { workspaceId: input.workspaceId, userId: input.userId },
            });
            if (existing)
                return result_1.Result.fail(new workspace_errors_1.WorkspaceMemberAlreadyExistsError());
            const record = await this.prisma.workspaceMember.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    workspaceId: input.workspaceId,
                    userId: input.userId,
                    role: input.role,
                    joinedAt: new Date(),
                    status: 'ACTIVE',
                },
            });
            return result_1.Result.ok(new workspace_entity_1.WorkspaceMember(record.id, record.workspaceId, record.userId, record.role, true, input.requesterId, record.joinedAt, record.createdAt, record.updatedAt));
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
    async removeMember(input) {
        try {
            const workspace = await this.prisma.workspace.findUnique({
                where: { id: input.workspaceId },
            });
            if (!workspace)
                return result_1.Result.fail(new workspace_errors_1.WorkspaceNotFoundError());
            const targetMember = await this.prisma.workspaceMember.findFirst({
                where: { workspaceId: input.workspaceId, userId: input.memberId },
            });
            if (!targetMember)
                return result_1.Result.fail(new workspace_errors_1.WorkspaceMemberNotFoundError());
            if (targetMember.role === client_1.WorkspaceMemberRole.OWNER) {
                return result_1.Result.fail(new workspace_errors_1.CannotRemoveOwnerError());
            }
            const requester = await this.prisma.workspaceMember.findFirst({
                where: {
                    workspaceId: input.workspaceId,
                    userId: input.requesterId,
                    status: 'ACTIVE',
                    role: { in: [client_1.WorkspaceMemberRole.OWNER, client_1.WorkspaceMemberRole.MANAGER] },
                },
            });
            if (!requester)
                return result_1.Result.fail(new workspace_errors_1.WorkspaceAccessDeniedError());
            await this.prisma.workspaceMember.update({
                where: { id: targetMember.id },
                data: { status: 'SUSPENDED' },
            });
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
    async listMembers(workspaceId, requesterId) {
        const member = await this.prisma.workspaceMember.findFirst({
            where: { workspaceId, userId: requesterId, status: 'ACTIVE' },
        });
        if (!member)
            throw new workspace_errors_1.WorkspaceAccessDeniedError();
        return this.prisma.workspaceMember.findMany({
            where: { workspaceId, status: 'ACTIVE' },
            include: {
                user: {
                    select: { id: true, phoneNumber: true, email: true },
                },
            },
            orderBy: { joinedAt: 'asc' },
        });
    }
};
exports.WorkspaceService = WorkspaceService;
exports.WorkspaceService = WorkspaceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], WorkspaceService);
let WorkspaceController = class WorkspaceController {
    constructor(service) {
        this.service = service;
    }
    async create(dto, user) {
        const result = await this.service.createWorkspace({ ownerId: user.userId, ...dto });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async listMine(user) {
        return this.service.listMyWorkspaces(user.userId);
    }
    async get(id, user) {
        const result = await this.service.getWorkspace(id, user.userId);
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async update(id, dto, user) {
        const result = await this.service.updateWorkspace({
            workspaceId: id,
            requesterId: user.userId,
            fields: dto,
        });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async members(id, user) {
        return this.service.listMembers(id, user.userId);
    }
    async invite(id, dto, user) {
        const result = await this.service.inviteMember({
            workspaceId: id,
            requesterId: user.userId,
            userId: dto.userId,
            role: dto.role,
        });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async remove(id, memberId, user) {
        const result = await this.service.removeMember({
            workspaceId: id,
            requesterId: user.userId,
            memberId,
        });
        if (result.isFail)
            throw result.error;
    }
};
exports.WorkspaceController = WorkspaceController;
__decorate([
    (0, common_2.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a workspace' }),
    __param(0, (0, common_2.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateWorkspaceDto, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "create", null);
__decorate([
    (0, common_2.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List my workspaces' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "listMine", null);
__decorate([
    (0, common_2.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get workspace details' }),
    __param(0, (0, common_2.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "get", null);
__decorate([
    (0, common_2.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update workspace' }),
    __param(0, (0, common_2.Param)('id')),
    __param(1, (0, common_2.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateWorkspaceDto, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "update", null);
__decorate([
    (0, common_2.Get)(':id/members'),
    (0, swagger_1.ApiOperation)({ summary: 'List workspace members' }),
    __param(0, (0, common_2.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "members", null);
__decorate([
    (0, common_2.Post)(':id/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Invite a member to workspace' }),
    __param(0, (0, common_2.Param)('id')),
    __param(1, (0, common_2.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, InviteMemberDto, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "invite", null);
__decorate([
    (0, common_2.Delete)(':id/members/:memberId'),
    (0, common_2.HttpCode)(common_2.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a member from workspace' }),
    __param(0, (0, common_2.Param)('id')),
    __param(1, (0, common_2.Param)('memberId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WorkspaceController.prototype, "remove", null);
exports.WorkspaceController = WorkspaceController = __decorate([
    (0, swagger_1.ApiTags)('Workspaces'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_2.Controller)('workspaces'),
    __metadata("design:paramtypes", [WorkspaceService])
], WorkspaceController);
let WorkspaceModule = class WorkspaceModule {
};
exports.WorkspaceModule = WorkspaceModule;
exports.WorkspaceModule = WorkspaceModule = __decorate([
    (0, common_2.Module)({
        controllers: [WorkspaceController],
        providers: [WorkspaceService],
        exports: [WorkspaceService],
    })
], WorkspaceModule);
//# sourceMappingURL=workspace.module.js.map