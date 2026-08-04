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
exports.MediaController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../../core/security/decorators/current-user.decorator");
const upload_media_use_case_1 = require("../application/use-cases/upload-media.use-case");
const prisma_service_1 = require("../../../shared/infrastructure/prisma.service");
const app_error_1 = require("../../../core/errors/app-error");
const class_validator_1 = require("class-validator");
class UploadMediaBodyDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadMediaBodyDto.prototype, "entityType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadMediaBodyDto.prototype, "entityId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadMediaBodyDto.prototype, "subType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UploadMediaBodyDto.prototype, "isPublic", void 0);
let MediaController = class MediaController {
    constructor(uploadMedia, prisma) {
        this.uploadMedia = uploadMedia;
        this.prisma = prisma;
    }
    async upload(file, body, user) {
        const result = await this.uploadMedia.execute({
            file,
            uploaderId: user.userId,
            entityType: body.entityType,
            entityId: body.entityId,
            subType: body.subType,
            isPublic: body.isPublic,
        });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async getEntityMedia(type, id, subType) {
        const where = {
            entityType: type,
            entityId: id,
        };
        if (subType)
            where.subType = subType;
        return this.prisma.media.findMany({
            where,
            orderBy: { createdAt: 'asc' },
        });
    }
    async delete(id, user) {
        const media = await this.prisma.media.findUnique({ where: { id } });
        if (!media || media.uploaderId !== user.userId) {
            if (media && !user.roles.includes('ADMIN')) {
                throw new app_error_1.NotFoundError('Media not found or access denied');
            }
        }
        await this.prisma.media.delete({ where: { id } });
    }
};
exports.MediaController = MediaController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload a media file' }),
    openapi.ApiResponse({ status: 201, type: require("../domain/entities/media.entity").Media }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UploadMediaBodyDto, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)('entity/:type/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all media for an entity' }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('subType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getEntityMedia", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a media file' }),
    openapi.ApiResponse({ status: common_1.HttpStatus.NO_CONTENT }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "delete", null);
exports.MediaController = MediaController = __decorate([
    (0, swagger_1.ApiTags)('Media'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('media'),
    __metadata("design:paramtypes", [upload_media_use_case_1.UploadMediaUseCase,
        prisma_service_1.PrismaService])
], MediaController);
//# sourceMappingURL=media.controller.js.map