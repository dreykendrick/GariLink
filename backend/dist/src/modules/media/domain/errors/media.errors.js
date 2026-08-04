"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageError = exports.MediaNotFoundError = exports.InvalidMimeTypeError = exports.FileTooLargeError = void 0;
const app_error_1 = require("../../../../core/errors/app-error");
class FileTooLargeError extends app_error_1.BadRequestError {
    constructor(maxMb) {
        super(`File exceeds the maximum size of ${maxMb}MB`);
        this.code = 'FILE_TOO_LARGE';
    }
}
exports.FileTooLargeError = FileTooLargeError;
class InvalidMimeTypeError extends app_error_1.BadRequestError {
    constructor(mimeType) {
        super(`File type "${mimeType}" is not allowed`);
        this.code = 'INVALID_MIME_TYPE';
    }
}
exports.InvalidMimeTypeError = InvalidMimeTypeError;
class MediaNotFoundError extends app_error_1.NotFoundError {
    constructor() {
        super('Media file not found');
        this.code = 'MEDIA_NOT_FOUND';
    }
}
exports.MediaNotFoundError = MediaNotFoundError;
class StorageError extends app_error_1.InternalError {
    constructor(detail) {
        super(`Storage operation failed${detail ? `: ${detail}` : ''}`);
        this.code = 'STORAGE_ERROR';
    }
}
exports.StorageError = StorageError;
//# sourceMappingURL=media.errors.js.map