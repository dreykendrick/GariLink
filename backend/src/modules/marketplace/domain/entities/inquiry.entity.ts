import { Entity } from '../../../../shared/domain/entity.base';
import { InquiryStatus } from '@prisma/client';

export class Inquiry extends Entity<string> {
  constructor(
    id: string,
    public readonly listingId: string,
    public readonly inquirerId: string,
    public status: InquiryStatus,
    public readonly message: string,
    public readonly offeredPrice: number | null,
    public readonly offerCurrency: string | null,
    public respondedAt: Date | null,
    public readonly respondedById: string | null,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
  }

  accept(): void {
    this.status = InquiryStatus.ACCEPTED;
    this.respondedAt = new Date();
    this.touch();
  }

  decline(): void {
    this.status = InquiryStatus.DECLINED;
    this.respondedAt = new Date();
    this.touch();
  }

  close(): void {
    this.status = InquiryStatus.CLOSED;
    this.touch();
  }

  static create(params: {
    id: string;
    listingId: string;
    inquirerId: string;
    message: string;
    offeredPrice?: number;
    offerCurrency?: string;
  }): Inquiry {
    return new Inquiry(
      params.id,
      params.listingId,
      params.inquirerId,
      InquiryStatus.PENDING,
      params.message,
      params.offeredPrice ?? null,
      params.offerCurrency ?? null,
      null,
      null,
    );
  }
}
