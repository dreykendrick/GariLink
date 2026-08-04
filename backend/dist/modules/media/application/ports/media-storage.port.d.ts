export declare const MEDIA_STORAGE = "MEDIA_STORAGE";
export interface IMediaStoragePort {
    upload(buffer: Buffer, storageKey: string, mimeType: string): Promise<string>;
    delete(storageKey: string): Promise<void>;
    getSignedUrl(storageKey: string, expirySeconds: number): Promise<string>;
}
