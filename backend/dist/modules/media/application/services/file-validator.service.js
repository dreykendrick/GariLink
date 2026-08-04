"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileValidatorService = void 0;
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const uuid_1 = require("uuid");
const media_errors_1 = require("../../domain/errors/media.errors");
let FileValidatorService = class FileValidatorService {
    validate(file, allowedMimeTypes, maxSizeMb) {
        const maxBytes = maxSizeMb * 1024 * 1024;
        if (file.size > maxBytes) {
            throw new media_errors_1.FileTooLargeError(maxSizeMb);
        }
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new media_errors_1.InvalidMimeTypeError(file.mimetype);
        }
    }
    generateStorageKey(entityType, entityId, originalName) {
        const ext = (0, path_1.extname)(originalName).toLowerCase();
        const uid = (0, uuid_1.v4)();
        return `${entityType}/${entityId}/${uid}${ext}`;
    }
    sanitizeFilename(originalName) {
        return originalName
            .toLowerCase()
            .replace(/[^a-z0-9.\-_]/g, '_')
            .replace(/_{2,}/g, '_');
    }
};
exports.FileValidatorService = FileValidatorService;
exports.FileValidatorService = FileValidatorService = __decorate([
    (0, common_1.Injectable)()
], FileValidatorService);
//# sourceMappingURL=file-validator.service.js.map