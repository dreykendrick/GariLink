import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WorkspaceType, WorkspaceMemberRole } from '@prisma/client';
import { Result } from '../../shared/domain/result';
import { AppError, ForbiddenError, NotFoundError, ConflictError } from '../../core/errors/app-error';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { Workspace, WorkspaceMember } from './domain/entities/workspace.entity';
import {
  WorkspaceNotFoundError,
  WorkspaceAccessDeniedError,
  WorkspaceMemberAlreadyExistsError,
  WorkspaceMemberNotFoundError,
  CannotRemoveOwnerError,
} from './domain/errors/workspace.errors';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Module,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../core/security/decorators/current-user.decorator';
import { AccessJwtPayload } from '../../core/security/token.service';

// ─────────────────────────────────────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────────────────────────────────────

class CreateWorkspaceDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsEnum(WorkspaceType) type!: WorkspaceType;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() currency?: string;
}

class UpdateWorkspaceDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() slug?: string;
}

class InviteMemberDto {
  @IsString() @IsNotEmpty() userId!: string;
  @IsEnum(WorkspaceMemberRole) role!: WorkspaceMemberRole;
}

class UpdateMemberRoleDto {
  @IsEnum(WorkspaceMemberRole) role!: WorkspaceMemberRole;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service (Application Layer)
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private toWorkspaceDomain(r: {
    id: string; name: string; type: WorkspaceType; ownerId: string;
    slug: string | null; description: string | null; logoUrl: string | null;
    isVerified: boolean; isActive: boolean; country: string;
    createdAt: Date; updatedAt: Date;
  }): Workspace {
    return new Workspace(r.id, {
      name: r.name, type: r.type, ownerId: r.ownerId, slug: r.slug,
      description: r.description, logoUrl: r.logoUrl ?? null, isVerified: r.isVerified,
      isActive: r.isActive, country: r.country,
    }, r.createdAt, r.updatedAt);
  }

  async createWorkspace(input: {
    ownerId: string;
    name: string;
    type: WorkspaceType;
    description?: string;
    slug?: string;
    country?: string;
  }): Promise<Result<Workspace, AppError>> {
    try {
      const id = uuidv4();
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
              id: uuidv4(),
              userId: input.ownerId,
              role: WorkspaceMemberRole.OWNER,
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

      return Result.ok(this.toWorkspaceDomain(record));
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }

  async getWorkspace(id: string, requesterId: string): Promise<Result<Workspace, AppError>> {
    const record = await this.prisma.workspace.findUnique({ where: { id } });
    if (!record) return Result.fail(new WorkspaceNotFoundError());

    // Check membership
    const member = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId: id, userId: requesterId, status: 'ACTIVE' },
    });
    if (!member) return Result.fail(new WorkspaceAccessDeniedError());

    return Result.ok(this.toWorkspaceDomain(record));
  }

  async listMyWorkspaces(userId: string): Promise<Workspace[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { workspace: true },
      orderBy: { joinedAt: 'desc' },
    });
    return memberships.map((m: any) => this.toWorkspaceDomain(m.workspace));
  }

  async updateWorkspace(input: {
    workspaceId: string;
    requesterId: string;
    fields: { name?: string; description?: string; slug?: string };
  }): Promise<Result<Workspace, AppError>> {
    try {
      const member = await this.prisma.workspaceMember.findFirst({
        where: {
          workspaceId: input.workspaceId,
          userId: input.requesterId,
          status: 'ACTIVE',
          role: { in: [WorkspaceMemberRole.OWNER, WorkspaceMemberRole.MANAGER] },
        },
      });
      if (!member) return Result.fail(new WorkspaceAccessDeniedError());

      const updated = await this.prisma.workspace.update({
        where: { id: input.workspaceId },
        data: input.fields,
      });
      return Result.ok(this.toWorkspaceDomain(updated));
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }

  async inviteMember(input: {
    workspaceId: string;
    requesterId: string;
    userId: string;
    role: WorkspaceMemberRole;
  }): Promise<Result<WorkspaceMember, AppError>> {
    try {
      const requester = await this.prisma.workspaceMember.findFirst({
        where: {
          workspaceId: input.workspaceId,
          userId: input.requesterId,
          status: 'ACTIVE',
          role: { in: [WorkspaceMemberRole.OWNER, WorkspaceMemberRole.MANAGER] },
        },
      });
      if (!requester) return Result.fail(new WorkspaceAccessDeniedError());

      const existing = await this.prisma.workspaceMember.findFirst({
        where: { workspaceId: input.workspaceId, userId: input.userId },
      });
      if (existing) return Result.fail(new WorkspaceMemberAlreadyExistsError());

      const record = await this.prisma.workspaceMember.create({
        data: {
          id: uuidv4(),
          workspaceId: input.workspaceId,
          userId: input.userId,
          role: input.role,
          joinedAt: new Date(),
          status: 'ACTIVE',
        },
      });

      return Result.ok(new WorkspaceMember(
        record.id, record.workspaceId, record.userId, record.role,
        true, input.requesterId, record.joinedAt,
        record.createdAt, record.updatedAt,
      ));
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }

  async removeMember(input: {
    workspaceId: string;
    requesterId: string;
    memberId: string;
  }): Promise<Result<void, AppError>> {
    try {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: input.workspaceId },
      });
      if (!workspace) return Result.fail(new WorkspaceNotFoundError());

      const targetMember = await this.prisma.workspaceMember.findFirst({
        where: { workspaceId: input.workspaceId, userId: input.memberId },
      });
      if (!targetMember) return Result.fail(new WorkspaceMemberNotFoundError());

      if (targetMember.role === WorkspaceMemberRole.OWNER) {
        return Result.fail(new CannotRemoveOwnerError());
      }

      const requester = await this.prisma.workspaceMember.findFirst({
        where: {
          workspaceId: input.workspaceId,
          userId: input.requesterId,
          status: 'ACTIVE',
          role: { in: [WorkspaceMemberRole.OWNER, WorkspaceMemberRole.MANAGER] },
        },
      });
      if (!requester) return Result.fail(new WorkspaceAccessDeniedError());

      await this.prisma.workspaceMember.update({
        where: { id: targetMember.id },
        data: { status: 'SUSPENDED' },
      });
      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }

  async listMembers(workspaceId: string, requesterId: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: requesterId, status: 'ACTIVE' },
    });
    if (!member) throw new WorkspaceAccessDeniedError();

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
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────────────────────────────────────

@ApiTags('Workspaces')
@ApiBearerAuth()
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly service: WorkspaceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a workspace' })
  async create(
    @Body() dto: CreateWorkspaceDto,
    @CurrentUser() user: AccessJwtPayload,
  ) {
    const result = await this.service.createWorkspace({ ownerId: user.userId, ...dto });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Get()
  @ApiOperation({ summary: 'List my workspaces' })
  async listMine(@CurrentUser() user: AccessJwtPayload) {
    return this.service.listMyWorkspaces(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace details' })
  async get(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.service.getWorkspace(id, user.userId);
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
    @CurrentUser() user: AccessJwtPayload,
  ) {
    const result = await this.service.updateWorkspace({
      workspaceId: id,
      requesterId: user.userId,
      fields: dto,
    });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List workspace members' })
  async members(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    return this.service.listMembers(id, user.userId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Invite a member to workspace' })
  async invite(
    @Param('id') id: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: AccessJwtPayload,
  ) {
    const result = await this.service.inviteMember({
      workspaceId: id,
      requesterId: user.userId,
      userId: dto.userId,
      role: dto.role,
    });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from workspace' })
  async remove(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AccessJwtPayload,
  ) {
    const result = await this.service.removeMember({
      workspaceId: id,
      requesterId: user.userId,
      memberId,
    });
    if (result.isFail) throw result.error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Module
// ─────────────────────────────────────────────────────────────────────────────

@Module({
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
