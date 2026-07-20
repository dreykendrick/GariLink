import { Injectable } from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileTooLargeError, InvalidMimeTypeError } from '../../domain/errors/media.errors';

@Injectable()
export class FileValidatorService {
  validate(
    file: Express.Multer.File,
    allowedMimeTypes: string[],
    maxSizeMb: number,
  ): void {
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new FileTooLargeError(maxSizeMb);
    }
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new InvalidMimeTypeError(file.mimetype);
    }
  }

  generateStorageKey(
    entityType: string,
    entityId: string,
    originalName: string,
  ): string {
    const ext = extname(originalName).toLowerCase();
    const uid = uuidv4();
    // e.g. Vehicle/clxyz123/a1b2c3d4.jpg
    return `${entityType}/${entityId}/${uid}${ext}`;
  }

  sanitizeFilename(originalName: string): string {
    return originalName
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, '_')
      .replace(/_{2,}/g, '_');
  }
}
