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
exports.OrganizationModule = exports.OrganizationController = exports.OrganizationService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const common_2 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const result_1 = require("../../shared/domain/result");
const app_error_1 = require("../../core/errors/app-error");
const prisma_service_1 = require("../../shared/infrastructure/prisma.service");
const audit_log_service_1 = require("../audit/audit-log.service");
const current_user_decorator_1 = require("../../core/security/decorators/current-user.decorator");
class CreateOrganizationDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "workspaceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.WorkspaceType),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "registrationNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "website", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "county", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "city", void 0);
class UpdateOrganizationDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "website", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "county", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.WorkspaceType),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "type", void 0);
class AddOrgMemberDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddOrgMemberDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.OrganizationMemberRole),
    __metadata("design:type", String)
], AddOrgMemberDto.prototype, "role", void 0);
let OrganizationService = class OrganizationService {
    constructor(prisma, auditLog) {
        this.prisma = prisma;
        this.auditLog = auditLog;
    }
    async create(input) {
        try {
            const member = await this.prisma.workspaceMember.findFirst({
                where: { workspaceId: input.workspaceId, userId: input.userId, status: 'ACTIVE' },
            });
            if (!member)
                return result_1.Result.fail(new app_error_1.ForbiddenError('You must be a workspace member to create an organization'));
            const id = (0, uuid_1.v4)();
            const org = await this.prisma.organization.create({
                data: {
                    id,
                    workspace: { connect: { id: input.workspaceId } },
                    ownerId: input.userId,
                    name: input.name,
                    slug: input.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                    type: input.type,
                    website: input.website ?? null,
                    description: input.description ?? null,
                    members: {
                        create: {
                            id: (0, uuid_1.v4)(),
                            userId: input.userId,
                            role: client_1.OrganizationMemberRole.OWNER,
                            joinedAt: new Date(),
                        },
                    },
                },
                include: { members: true },
            });
            await this.auditLog.log({
                action: 'organization.created',
                actorId: input.userId,
                subjectType: 'Organization',
                subjectId: id,
            });
            return result_1.Result.ok(org);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
    async findById(id) {
        const org = await this.prisma.organization.findUnique({
            where: { id },
            include: { members: { where: { status: 'ACTIVE' } } },
        });
        if (!org)
            return result_1.Result.fail(new app_error_1.NotFoundError('Organization not found'));
        return result_1.Result.ok(org);
    }
    async listByWorkspace(workspaceId, userId) {
        await this.prisma.workspaceMember.findFirstOrThrow({
            where: { workspaceId, userId, status: 'ACTIVE' },
        });
        return this.prisma.organization.findMany({
            where: { workspace: { id: workspaceId } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async update(input) {
        try {
            const member = await this.prisma.organizationMember.findFirst({
                where: {
                    organizationId: input.orgId,
                    userId: input.userId,
                    status: 'ACTIVE',
                    role: { in: [client_1.OrganizationMemberRole.OWNER, client_1.OrganizationMemberRole.MANAGER] },
                },
            });
            if (!member)
                return result_1.Result.fail(new app_error_1.ForbiddenError('Insufficient permissions'));
            const updated = await this.prisma.organization.update({
                where: { id: input.orgId },
                data: input.fields,
            });
            return result_1.Result.ok(updated);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
    async addMember(input) {
        try {
            const requester = await this.prisma.organizationMember.findFirst({
                where: {
                    organizationId: input.orgId,
                    userId: input.requesterId,
                    status: 'ACTIVE',
                    role: { in: [client_1.OrganizationMemberRole.OWNER, client_1.OrganizationMemberRole.MANAGER] },
                },
            });
            if (!requester)
                return result_1.Result.fail(new app_error_1.ForbiddenError('Insufficient permissions'));
            const existing = await this.prisma.organizationMember.findFirst({
                where: { organizationId: input.orgId, userId: input.userId },
            });
            if (existing)
                return result_1.Result.fail(new app_error_1.ConflictError('User is already a member'));
            const record = await this.prisma.organizationMember.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    organizationId: input.orgId,
                    userId: input.userId,
                    role: input.role,
                    joinedAt: new Date(),
                    status: 'ACTIVE',
                },
            });
            return result_1.Result.ok(record);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
};
exports.OrganizationService = OrganizationService;
exports.OrganizationService = OrganizationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_log_service_1.AuditLogService])
], OrganizationService);
let OrganizationController = class OrganizationController {
    constructor(service) {
        this.service = service;
    }
    async create(dto, user) {
        const result = await this.service.create({ ...dto, userId: user.userId });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async listByWorkspace(workspaceId, user) {
        return this.service.listByWorkspace(workspaceId, user.userId);
    }
    async get(id) {
        const result = await this.service.findById(id);
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async update(id, dto, user) {
        const result = await this.service.update({ orgId: id, userId: user.userId, fields: dto });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async addMember(id, dto, user) {
        const result = await this.service.addMember({
            orgId: id,
            requesterId: user.userId,
            userId: dto.userId,
            role: dto.role,
        });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
};
exports.OrganizationController = OrganizationController;
__decorate([
    (0, common_2.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create an organization within a workspace' }),
    __param(0, (0, common_2.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateOrganizationDto, Object]),
    __metadata("design:returntype", Promise)
], OrganizationController.prototype, "create", null);
__decorate([
    (0, common_2.Get)('workspace/:workspaceId'),
    (0, swagger_1.ApiOperation)({ summary: 'List organizations in a workspace' }),
    __param(0, (0, common_2.Param)('workspaceId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrganizationController.prototype, "listByWorkspace", null);
__decorate([
    (0, common_2.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get organization details' }),
    __param(0, (0, common_2.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrganizationController.prototype, "get", null);
__decorate([
    (0, common_2.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update organization' }),
    __param(0, (0, common_2.Param)('id')),
    __param(1, (0, common_2.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateOrganizationDto, Object]),
    __metadata("design:returntype", Promise)
], OrganizationController.prototype, "update", null);
__decorate([
    (0, common_2.Post)(':id/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Add member to organization' }),
    __param(0, (0, common_2.Param)('id')),
    __param(1, (0, common_2.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AddOrgMemberDto, Object]),
    __metadata("design:returntype", Promise)
], OrganizationController.prototype, "addMember", null);
exports.OrganizationController = OrganizationController = __decorate([
    (0, swagger_1.ApiTags)('Organizations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_2.Controller)('organizations'),
    __metadata("design:paramtypes", [OrganizationService])
], OrganizationController);
let OrganizationModule = class OrganizationModule {
};
exports.OrganizationModule = OrganizationModule;
exports.OrganizationModule = OrganizationModule = __decorate([
    (0, common_2.Module)({
        controllers: [OrganizationController],
        providers: [OrganizationService],
        exports: [OrganizationService],
    })
], OrganizationModule);
//# sourceMappingURL=organization.module.js.map