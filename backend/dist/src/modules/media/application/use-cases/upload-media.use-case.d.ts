import { ConfigService } from '@nestjs/config';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { Media } from '../../domain/entities/media.entity';
import { IMediaStoragePort } from '../ports/media-storage.port';
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
export declare class UploadMediaUseCase {
    private readonly storage;
    private readonly validator;
    private readonly prisma;
    private readonly configService;
    constructor(storage: IMediaStoragePort, validator: FileValidatorService, prisma: PrismaService, configService: ConfigService);
    execute(input: UploadMediaInput): Promise<Result<Media, AppError>>;
}
