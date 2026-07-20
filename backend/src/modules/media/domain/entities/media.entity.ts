import { Entity } from '../../../../shared/domain/entity.base';

export type MediaType = 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'OTHER';

export class Media extends Entity<string> {
  constructor(
    id: string,
    public readonly uploaderId: string,
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly subType: string,
    public readonly filename: string,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly sizeBytes: number,
    public readonly storageKey: string,
    public publicUrl: string,
    public isPublic: boolean,
    public readonly width: number | null,
    public readonly height: number | null,
    public readonly durationSeconds: number | null,
    public thumbnailUrl: string | null,
    public readonly pageCount: number | null,
    public readonly checksum: string | null,
    public readonly expiresAt: Date | null,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
  }

  get mediaType(): MediaType {
    if (this.mimeType.startsWith('image/')) return 'PHOTO';
    if (this.mimeType.startsWith('video/')) return 'VIDEO';
    if (
      this.mimeType === 'application/pdf' ||
      this.mimeType.startsWith('application/msword') ||
      this.mimeType.includes('document')
    )
      return 'DOCUMENT';
    return 'OTHER';
  }

  static create(params: {
    id: string;
    uploaderId: string;
    entityType: string;
    entityId: string;
    subType: string;
    filename: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    publicUrl: string;
    isPublic?: boolean;
    width?: number;
    height?: number;
  }): Media {
    return new Media(
      params.id,
      params.uploaderId,
      params.entityType,
      params.entityId,
      params.subType,
      params.filename,
      params.originalName,
      params.mimeType,
      params.sizeBytes,
      params.storageKey,
      params.publicUrl,
      params.isPublic ?? true,
      params.width ?? null,
      params.height ?? null,
      null,
      null,
      null,
      null,
      null,
    );
  }
}
