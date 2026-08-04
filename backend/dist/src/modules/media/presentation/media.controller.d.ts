import { AccessJwtPayload } from '../../../core/security/token.service';
import { UploadMediaUseCase } from '../application/use-cases/upload-media.use-case';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
declare class UploadMediaBodyDto {
    entityType: string;
    entityId: string;
    subType: string;
    isPublic?: boolean;
}
export declare class MediaController {
    private readonly uploadMedia;
    private readonly prisma;
    constructor(uploadMedia: UploadMediaUseCase, prisma: PrismaService);
    upload(file: Express.Multer.File, body: UploadMediaBodyDto, user: AccessJwtPayload): Promise<import("../domain/entities/media.entity").Media>;
    getEntityMedia(type: string, id: string, subType?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isPublic: boolean;
        expiresAt: Date | null;
        entityType: string;
        entityId: string;
        subType: string;
        filename: string;
        originalName: string;
        mimeType: string;
        sizeBytes: number;
        storageKey: string;
        publicUrl: string;
        width: number | null;
        height: number | null;
        durationSeconds: number | null;
        thumbnailUrl: string | null;
        pageCount: number | null;
        checksum: string | null;
        uploaderId: string;
    }[]>;
    delete(id: string, user: AccessJwtPayload): Promise<void>;
}
export {};
