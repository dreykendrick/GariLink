import { Entity } from '../../../../shared/domain/entity.base';
import { InquiryStatus } from '@prisma/client';
export declare class Inquiry extends Entity<string> {
    readonly listingId: string;
    readonly inquirerId: string;
    status: InquiryStatus;
    readonly message: string;
    readonly offeredPrice: number | null;
    readonly offerCurrency: string | null;
    respondedAt: Date | null;
    readonly respondedById: string | null;
    constructor(id: string, listingId: string, inquirerId: string, status: InquiryStatus, message: string, offeredPrice: number | null, offerCurrency: string | null, respondedAt: Date | null, respondedById: string | null, createdAt?: Date, updatedAt?: Date);
    accept(): void;
    decline(): void;
    close(): void;
    static create(params: {
        id: string;
        listingId: string;
        inquirerId: string;
        message: string;
        offeredPrice?: number;
        offerCurrency?: string;
    }): Inquiry;
}
