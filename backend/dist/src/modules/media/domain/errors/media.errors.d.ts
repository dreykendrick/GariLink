import { BadRequestError, NotFoundError, InternalError } from '../../../../core/errors/app-error';
export declare class FileTooLargeError extends BadRequestError {
    readonly code = "FILE_TOO_LARGE";
    constructor(maxMb: number);
}
export declare class InvalidMimeTypeError extends BadRequestError {
    readonly code = "INVALID_MIME_TYPE";
    constructor(mimeType: string);
}
export declare class MediaNotFoundError extends NotFoundError {
    readonly code = "MEDIA_NOT_FOUND";
    constructor();
}
export declare class StorageError extends InternalError {
    readonly code = "STORAGE_ERROR";
    constructor(detail?: string);
}
