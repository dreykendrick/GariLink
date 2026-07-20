import {
  BadRequestError,
  NotFoundError,
  InternalError,
} from '../../../../core/errors/app-error';

export class FileTooLargeError extends BadRequestError {
  override readonly code = 'FILE_TOO_LARGE';
  constructor(maxMb: number) {
    super(`File exceeds the maximum size of ${maxMb}MB`);
  }
}

export class InvalidMimeTypeError extends BadRequestError {
  override readonly code = 'INVALID_MIME_TYPE';
  constructor(mimeType: string) {
    super(`File type "${mimeType}" is not allowed`);
  }
}

export class MediaNotFoundError extends NotFoundError {
  override readonly code = 'MEDIA_NOT_FOUND';
  constructor() {
    super('Media file not found');
  }
}

export class StorageError extends InternalError {
  override readonly code = 'STORAGE_ERROR';
  constructor(detail?: string) {
    super(`Storage operation failed${detail ? `: ${detail}` : ''}`);
  }
}
