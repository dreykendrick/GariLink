import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  Controller, Post, Get, Patch, Body, Param,
  HttpCode, HttpStatus, Module,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsEmail } from 'class-validator';
import {
  WorkspaceType, OrganizationMemberRole, VerificationStatus,
} from '@prisma/client';

import { Result } from '../../shared/domain/result';
import { AppError, NotFoundError, ForbiddenError, ConflictError } from '../../core/errors/app-error';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CurrentUser } from '../../core/security/decorators/current-user.decorator';
import { AccessJwtPayload } from '../../core/security/token.service';

// ─── DTOs ──────────────────────────────────────────────────────────────────

class CreateOrganizationDto {
  @IsString() @IsNotEmpty() workspaceId!: string;
  @IsString() @IsNotEmpty() name!: string;
  @IsEnum(WorkspaceType) type!: WorkspaceType;
  @IsOptional() @IsString() registrationNumber?: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() county?: string;
  @IsOptional() @IsString() city?: string;
}

class UpdateOrganizationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() county?: string;
  @IsOptional() @IsEnum(WorkspaceType) type?: WorkspaceType;
}

class AddOrgMemberDto {
  @IsString() @IsNotEmpty() userId!: string;
  @IsEnum(OrganizationMemberRole) role!: OrganizationMemberRole;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(input: CreateOrganizationDto & { userId: string }): Promise<Result<unknown, AppError>> {
    try {
      // Check workspace membership
      const member = await this.prisma.workspaceMember.findFirst({
        where: { workspaceId: input.workspaceId, userId: input.userId, status: 'ACTIVE' },
      });
      if (!member) return Result.fail(new ForbiddenError('You must be a workspace member to create an organization'));

      const id = uuidv4();
      const org = await this.prisma.organization.create({
        data: {
          id,
          workspace: { connect: { id: input.workspaceId } },
          ownerId: input.userId,
          name: input.name,
          slug: input.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          type: input.type as any, // assuming type maps to WorkspaceType
          website: input.website ?? null,
          description: input.description ?? null,
          members: {
            create: {
              id: uuidv4(),
              userId: input.userId,
              role: OrganizationMemberRole.OWNER,
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

      return Result.ok(org);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }

  async findById(id: string): Promise<Result<unknown, AppError>> {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: { members: { where: { status: 'ACTIVE' } } },
    });
    if (!org) return Result.fail(new NotFoundError('Organization not found'));
    return Result.ok(org);
  }

  async listByWorkspace(workspaceId: string, userId: string): Promise<unknown[]> {
    // Verify membership
    await this.prisma.workspaceMember.findFirstOrThrow({
      where: { workspaceId, userId, status: 'ACTIVE' },
    });
    return this.prisma.organization.findMany({
      where: { workspace: { id: workspaceId } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(input: {
    orgId: string;
    userId: string;
    fields: Partial<UpdateOrganizationDto>;
  }): Promise<Result<unknown, AppError>> {
    try {
      const member = await this.prisma.organizationMember.findFirst({
        where: {
          organizationId: input.orgId,
          userId: input.userId,
          status: 'ACTIVE',
          role: { in: [OrganizationMemberRole.OWNER, OrganizationMemberRole.MANAGER] },
        },
      });
      if (!member) return Result.fail(new ForbiddenError('Insufficient permissions'));

      const updated = await this.prisma.organization.update({
        where: { id: input.orgId },
        data: input.fields,
      });
      return Result.ok(updated);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }

  async addMember(input: {
    orgId: string;
    requesterId: string;
    userId: string;
    role: OrganizationMemberRole;
  }): Promise<Result<unknown, AppError>> {
    try {
      const requester = await this.prisma.organizationMember.findFirst({
        where: {
          organizationId: input.orgId,
          userId: input.requesterId,
          status: 'ACTIVE',
          role: { in: [OrganizationMemberRole.OWNER, OrganizationMemberRole.MANAGER] },
        },
      });
      if (!requester) return Result.fail(new ForbiddenError('Insufficient permissions'));

      const existing = await this.prisma.organizationMember.findFirst({
        where: { organizationId: input.orgId, userId: input.userId },
      });
      if (existing) return Result.fail(new ConflictError('User is already a member'));

      const record = await this.prisma.organizationMember.create({
        data: {
          id: uuidv4(),
          organizationId: input.orgId,
          userId: input.userId,
          role: input.role,
          joinedAt: new Date(),
          status: 'ACTIVE',
        },
      });
      return Result.ok(record);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }
}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Post()
  @ApiOperation({ summary: 'Create an organization within a workspace' })
  async create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.service.create({ ...dto, userId: user.userId });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Get('workspace/:workspaceId')
  @ApiOperation({ summary: 'List organizations in a workspace' })
  async listByWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AccessJwtPayload,
  ) {
    return this.service.listByWorkspace(workspaceId, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization details' })
  async get(@Param('id') id: string) {
    const result = await this.service.findById(id);
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: AccessJwtPayload,
  ) {
    const result = await this.service.update({ orgId: id, userId: user.userId, fields: dto });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to organization' })
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddOrgMemberDto,
    @CurrentUser() user: AccessJwtPayload,
  ) {
    const result = await this.service.addMember({
      orgId: id,
      requesterId: user.userId,
      userId: dto.userId,
      role: dto.role,
    });
    if (result.isFail) throw result.error;
    return result.value;
  }
}

// ─── Module ───────────────────────────────────────────────────────────────────

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
