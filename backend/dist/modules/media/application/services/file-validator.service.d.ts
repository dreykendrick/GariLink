export declare class FileValidatorService {
    validate(file: Express.Multer.File, allowedMimeTypes: string[], maxSizeMb: number): void;
    generateStorageKey(entityType: string, entityId: string, originalName: string): string;
    sanitizeFilename(originalName: string): string;
}
