import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { Media } from '../../domain/entities/media.entity';
import { StorageError } from '../../domain/errors/media.errors';
import { MEDIA_STORAGE, IMediaStoragePort } from '../ports/media-storage.port';
import { FileValidatorService } from '../services/file-validator.service';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';

export interface UploadMediaInput {
  file: Express.Multer.File;
  uploaderId: string;
  entityType: string;
  entityId: string;
  subType: string;
  isPublic?: boolean;
}

@Injectable()
export class UploadMediaUseCase {
  constructor(
    @Inject(MEDIA_STORAGE) private readonly storage: IMediaStoragePort,
    private readonly validator: FileValidatorService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    input: UploadMediaInput,
  ): Promise<Result<Media, AppError>> {
    try {
      const maxMb =
        this.configService.get<number>('app.media.maxFileSizeMb') ?? 10;
      const allowedImages =
        this.configService.get<string[]>('app.media.allowedImageTypes') ?? [
          'image/jpeg',
          'image/png',
          'image/webp',
        ];
      const allowedVideos =
        this.configService.get<string[]>('app.media.allowedVideoTypes') ?? [
          'video/mp4',
        ];
      const allowedDocs =
        this.configService.get<string[]>('app.media.allowedDocTypes') ?? [
          'application/pdf',
        ];
      const allAllowed = [...allowedImages, ...allowedVideos, ...allowedDocs];

      this.validator.validate(input.file, allAllowed, maxMb);

      const storageKey = this.validator.generateStorageKey(
        input.entityType,
        input.entityId,
        input.file.originalname,
      );

      let publicUrl: string;
      try {
        publicUrl = await this.storage.upload(
          input.file.buffer,
          storageKey,
          input.file.mimetype,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown';
        return Result.fail(new StorageError(msg));
      }

      const id = uuidv4();
      const media = Media.create({
        id,
        uploaderId: input.uploaderId,
        entityType: input.entityType,
        entityId: input.entityId,
        subType: input.subType,
        filename: this.validator.sanitizeFilename(input.file.originalname),
        originalName: input.file.originalname,
        mimeType: input.file.mimetype,
        sizeBytes: input.file.size,
        storageKey,
        publicUrl,
        isPublic: input.isPublic ?? true,
      });

      await this.prisma.media.create({
        data: {
          id: media.id,
          uploaderId: media.uploaderId,
          entityType: media.entityType,
          entityId: media.entityId,
          subType: media.subType,
          filename: media.filename,
          originalName: media.originalName,
          mimeType: media.mimeType,
          sizeBytes: media.sizeBytes,
          storageKey: media.storageKey,
          publicUrl: media.publicUrl,
          isPublic: media.isPublic,
          width: media.width,
          height: media.height,
        },
      });

      return Result.ok(media);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }
}
