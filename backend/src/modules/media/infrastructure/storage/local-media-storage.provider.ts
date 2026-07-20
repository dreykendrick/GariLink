import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { IMediaStoragePort } from '../../application/ports/media-storage.port';

@Injectable()
export class LocalMediaStorageProvider implements IMediaStoragePort {
  private readonly basePath: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'LocalMediaStorageProvider cannot be used in production. Configure S3 or R2.',
      );
    }
    this.basePath =
      this.configService.get<string>('app.media.localPath') ?? './uploads';
    this.publicBaseUrl =
      this.configService.get<string>('app.media.publicBaseUrl') ??
      'http://localhost:3000/uploads';
  }

  async upload(
    buffer: Buffer,
    storageKey: string,
    _mimeType: string,
  ): Promise<string> {
    const filePath = path.join(this.basePath, storageKey);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, buffer);
    return `${this.publicBaseUrl}/${storageKey}`;
  }

  async delete(storageKey: string): Promise<void> {
    const filePath = path.join(this.basePath, storageKey);
    try {
      await fs.unlink(filePath);
    } catch {
      // File may not exist — swallow error
    }
  }

  async getSignedUrl(storageKey: string, _expirySeconds: number): Promise<string> {
    // For local storage, just return the public URL
    return `${this.publicBaseUrl}/${storageKey}`;
  }
}
