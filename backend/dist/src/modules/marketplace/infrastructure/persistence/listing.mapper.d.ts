import { Listing } from '../../domain/entities/listing.entity';
import { Prisma } from '@prisma/client';
type PrismaListingWithConfig = Prisma.ListingGetPayload<{
    include: {
        rentalConfig: true;
    };
}>;
export declare class ListingMapper {
    static toDomain(record: PrismaListingWithConfig): Listing;
    static toPersistence(domain: Listing): Prisma.ListingUncheckedCreateInput;
}
export {};
