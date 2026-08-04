import { ListingStatus } from '@prisma/client';
import { Result } from '../../shared/domain/result';
import { AppError } from '../../core/errors/app-error';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { AccessJwtPayload } from '../../core/security/token.service';
import { Listing } from './domain/entities/listing.entity';
import { Inquiry } from './domain/entities/inquiry.entity';
declare class CreateInquiryDto {
    message: string;
    offeredPrice?: number;
    offerCurrency?: string;
}
declare class RespondInquiryDto {
    decision: 'accept' | 'decline' | 'close';
}
export declare class MarketplaceService {
    private readonly prisma;
    private readonly auditLog;
    constructor(prisma: PrismaService, auditLog: AuditLogService);
    private toDomain;
    publishListing(listingId: string, userId: string): Promise<Result<Listing, AppError>>;
    updateStatus(input: {
        listingId: string;
        userId: string;
        status: ListingStatus;
    }): Promise<Result<Listing, AppError>>;
    getListing(listingId: string): Promise<Result<unknown, AppError>>;
    createInquiry(input: {
        listingId: string;
        inquirerId: string;
        message: string;
        offeredPrice?: number;
        offerCurrency?: string;
    }): Promise<Result<Inquiry, AppError>>;
    respondToInquiry(input: {
        inquiryId: string;
        userId: string;
        decision: 'accept' | 'decline' | 'close';
    }): Promise<Result<Inquiry, AppError>>;
    saveListing(listingId: string, userId: string): Promise<Result<void, AppError>>;
    unsaveListing(listingId: string, userId: string): Promise<Result<void, AppError>>;
    getSavedListings(userId: string): Promise<unknown[]>;
    getMyListings(userId: string): Promise<Listing[]>;
    deleteListing(listingId: string, userId: string): Promise<Result<void, AppError>>;
}
export declare class LegacyListingController {
    private readonly service;
    constructor(service: MarketplaceService);
    mine(user: AccessJwtPayload): Promise<Listing[]>;
    saved(user: AccessJwtPayload): Promise<unknown[]>;
    get(id: string): Promise<unknown>;
    publish(id: string, user: AccessJwtPayload): Promise<Listing>;
    updateStatus(id: string, body: {
        status: ListingStatus;
    }, user: AccessJwtPayload): Promise<Listing>;
    delete(id: string, user: AccessJwtPayload): Promise<void>;
    save(id: string, user: AccessJwtPayload): Promise<{
        saved: boolean;
    }>;
    unsave(id: string, user: AccessJwtPayload): Promise<void>;
    createInquiry(id: string, dto: CreateInquiryDto, user: AccessJwtPayload): Promise<Inquiry>;
}
export declare class InquiryController {
    private readonly service;
    constructor(service: MarketplaceService);
    respond(id: string, dto: RespondInquiryDto, user: AccessJwtPayload): Promise<Inquiry>;
}
export declare class MarketplaceModule {
}
export {};
