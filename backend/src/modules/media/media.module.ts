import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MEDIA_STORAGE } from './application/ports/media-storage.port';
import { UploadMediaUseCase } from './application/use-cases/upload-media.use-case';
import { FileValidatorService } from './application/services/file-validator.service';
import { LocalMediaStorageProvider } from './infrastructure/storage/local-media-storage.provider';
import { MediaController } from './presentation/media.controller';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [MediaController],
  providers: [
    { provide: MEDIA_STORAGE, useClass: LocalMediaStorageProvider },
    FileValidatorService,
    UploadMediaUseCase,
  ],
  exports: [MEDIA_STORAGE, FileValidatorService, UploadMediaUseCase],
})
export class MediaModule {}
