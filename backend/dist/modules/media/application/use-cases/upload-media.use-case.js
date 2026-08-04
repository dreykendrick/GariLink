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
exports.UploadMediaUseCase = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const result_1 = require("../../../../shared/domain/result");
const app_error_1 = require("../../../../core/errors/app-error");
const media_entity_1 = require("../../domain/entities/media.entity");
const media_errors_1 = require("../../domain/errors/media.errors");
const media_storage_port_1 = require("../ports/media-storage.port");
const file_validator_service_1 = require("../services/file-validator.service");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma.service");
let UploadMediaUseCase = class UploadMediaUseCase {
    constructor(storage, validator, prisma, configService) {
        this.storage = storage;
        this.validator = validator;
        this.prisma = prisma;
        this.configService = configService;
    }
    async execute(input) {
        try {
            const maxMb = this.configService.get('app.media.maxFileSizeMb') ?? 10;
            const allowedImages = this.configService.get('app.media.allowedImageTypes') ?? [
                'image/jpeg',
                'image/png',
                'image/webp',
            ];
            const allowedVideos = this.configService.get('app.media.allowedVideoTypes') ?? [
                'video/mp4',
            ];
            const allowedDocs = this.configService.get('app.media.allowedDocTypes') ?? [
                'application/pdf',
            ];
            const allAllowed = [...allowedImages, ...allowedVideos, ...allowedDocs];
            this.validator.validate(input.file, allAllowed, maxMb);
            const storageKey = this.validator.generateStorageKey(input.entityType, input.entityId, input.file.originalname);
            let publicUrl;
            try {
                publicUrl = await this.storage.upload(input.file.buffer, storageKey, input.file.mimetype);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : 'unknown';
                return result_1.Result.fail(new media_errors_1.StorageError(msg));
            }
            const id = (0, uuid_1.v4)();
            const media = media_entity_1.Media.create({
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
            return result_1.Result.ok(media);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
};
exports.UploadMediaUseCase = UploadMediaUseCase;
exports.UploadMediaUseCase = UploadMediaUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(media_storage_port_1.MEDIA_STORAGE)),
    __metadata("design:paramtypes", [Object, file_validator_service_1.FileValidatorService,
        prisma_service_1.PrismaService,
        config_1.ConfigService])
], UploadMediaUseCase);
//# sourceMappingURL=upload-media.use-case.js.map