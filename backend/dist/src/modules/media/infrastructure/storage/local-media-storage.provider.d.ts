import { ConfigService } from '@nestjs/config';
import { IMediaStoragePort } from '../../application/ports/media-storage.port';
export declare class LocalMediaStorageProvider implements IMediaStoragePort {
    private readonly configService;
    private readonly basePath;
    private readonly publicBaseUrl;
    constructor(configService: ConfigService);
    upload(buffer: Buffer, storageKey: string, _mimeType: string): Promise<string>;
    delete(storageKey: string): Promise<void>;
    getSignedUrl(storageKey: string, _expirySeconds: number): Promise<string>;
}
