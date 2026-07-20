import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/security/decorators/current-user.decorator';
import { AccessJwtPayload } from '../../../core/security/token.service';
import { UploadMediaUseCase } from '../application/use-cases/upload-media.use-case';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { NotFoundError } from '../../../core/errors/app-error';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

class UploadMediaBodyDto {
  @IsString() entityType!: string;
  @IsString() entityId!: string;
  @IsString() subType!: string;
  @IsOptional() @IsBoolean() isPublic?: boolean;
}

@ApiTags('Media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(
    private readonly uploadMedia: UploadMediaUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a media file' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadMediaBodyDto,
    @CurrentUser() user: AccessJwtPayload,
  ) {
    const result = await this.uploadMedia.execute({
      file,
      uploaderId: user.userId,
      entityType: body.entityType,
      entityId: body.entityId,
      subType: body.subType,
      isPublic: body.isPublic,
    });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Get('entity/:type/:id')
  @ApiOperation({ summary: 'Get all media for an entity' })
  async getEntityMedia(
    @Param('type') type: string,
    @Param('id') id: string,
    @Query('subType') subType?: string,
  ) {
    const where: Record<string, unknown> = {
      entityType: type,
      entityId: id,
    };
    if (subType) where.subType = subType;

    return this.prisma.media.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a media file' })
  async delete(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media || media.uploaderId !== user.userId) {
      if (media && !user.roles.includes('ADMIN')) {
        throw new NotFoundError('Media not found or access denied');
      }
    }
    await this.prisma.media.delete({ where: { id } });
  }
}
