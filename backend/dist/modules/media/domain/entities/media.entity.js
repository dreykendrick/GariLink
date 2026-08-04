"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Media = void 0;
const openapi = require("@nestjs/swagger");
const entity_base_1 = require("../../../../shared/domain/entity.base");
class Media extends entity_base_1.Entity {
    constructor(id, uploaderId, entityType, entityId, subType, filename, originalName, mimeType, sizeBytes, storageKey, publicUrl, isPublic, width, height, durationSeconds, thumbnailUrl, pageCount, checksum, expiresAt, createdAt, updatedAt) {
        super(id, createdAt, updatedAt);
        this.uploaderId = uploaderId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.subType = subType;
        this.filename = filename;
        this.originalName = originalName;
        this.mimeType = mimeType;
        this.sizeBytes = sizeBytes;
        this.storageKey = storageKey;
        this.publicUrl = publicUrl;
        this.isPublic = isPublic;
        this.width = width;
        this.height = height;
        this.durationSeconds = durationSeconds;
        this.thumbnailUrl = thumbnailUrl;
        this.pageCount = pageCount;
        this.checksum = checksum;
        this.expiresAt = expiresAt;
    }
    get mediaType() {
        if (this.mimeType.startsWith('image/'))
            return 'PHOTO';
        if (this.mimeType.startsWith('video/'))
            return 'VIDEO';
        if (this.mimeType === 'application/pdf' ||
            this.mimeType.startsWith('application/msword') ||
            this.mimeType.includes('document'))
            return 'DOCUMENT';
        return 'OTHER';
    }
    static create(params) {
        return new Media(params.id, params.uploaderId, params.entityType, params.entityId, params.subType, params.filename, params.originalName, params.mimeType, params.sizeBytes, params.storageKey, params.publicUrl, params.isPublic ?? true, params.width ?? null, params.height ?? null, null, null, null, null, null);
    }
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.Media = Media;
//# sourceMappingURL=media.entity.js.map