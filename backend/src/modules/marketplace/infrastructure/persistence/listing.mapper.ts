import { Listing } from '../../domain/entities/listing.entity';
import { Prisma } from '@prisma/client';
import { RentalConfigVO } from '../../domain/value-objects/rental-config.vo';
import { DailyRate } from '../../domain/value-objects/daily-rate.vo';
import { Currency } from '../../domain/value-objects/currency.vo';

type PrismaListingWithConfig = Prisma.ListingGetPayload<{
  include: { rentalConfig: true }
}>;

export class ListingMapper {
  static toDomain(record: PrismaListingWithConfig): Listing {
    let rentalConfig: RentalConfigVO | undefined;
    if (record.rentalConfig) {
      const currency = new Currency({ code: record.currency });
      const dailyRate = new DailyRate({ amount: Number(record.rentalConfig.dailyRate), currency });
      rentalConfig = new RentalConfigVO({
        dailyRate,
        depositAmount: Number(record.rentalConfig.depositAmount),
        pickupCounty: record.rentalConfig.pickupCounty,
        pickupCity: record.rentalConfig.pickupCity || '',
        fuelPolicy: record.rentalConfig.fuelPolicy as any,
        minimumRentalDays: record.rentalConfig.minimumRentalDays,
      });
    }

    return Listing.create(record.id, {
      vehicleId: record.vehicleId,
      workspaceId: record.workspaceId,
      listerId: record.listerId,
      type: record.type,
      title: record.title,
      description: record.description,
      currency: record.currency,
      askingPrice: record.askingPrice ? Number(record.askingPrice) : 0,
      negotiable: record.negotiable,
      status: record.status,
      publishedAt: record.publishedAt,
      expiresAt: record.expiresAt,
      viewCount: record.viewCount,
      saveCount: record.saveCount,
      contactCount: record.contactCount,
      isFeatured: record.isFeatured,
      featuredUntil: record.featuredUntil,
      conditionRating: record.conditionRating,
      conditionNotes: record.conditionNotes,
      tags: record.tags as string[],
      county: record.county,
      country: record.country,
      searchVector: null,
      deletedAt: record.deletedAt,
      rentalConfig,
      vehicle: (record as any).vehicle ? (record as any).vehicle : undefined,
    });
  }

  static toPersistence(domain: Listing): Prisma.ListingUncheckedCreateInput {
    const data: Prisma.ListingUncheckedCreateInput = {
      id: domain.id,
      vehicleId: domain.vehicleId,
      workspaceId: domain.workspaceId,
      listerId: domain.listerId,
      type: domain.type,
      title: domain.title,
      description: domain.description,
      currency: domain.currency,
      askingPrice: domain.askingPrice,
      negotiable: domain.negotiable,
      status: domain.props.status,
      publishedAt: domain.props.publishedAt,
      expiresAt: domain.props.expiresAt,
      viewCount: domain.props.viewCount,
      saveCount: domain.props.saveCount,
      contactCount: domain.props.contactCount,
      isFeatured: domain.props.isFeatured,
      featuredUntil: domain.props.featuredUntil,
      conditionRating: domain.props.conditionRating,
      conditionNotes: domain.props.conditionNotes,
      tags: domain.props.tags,
      county: domain.props.county,
      country: domain.props.country,
    };

    if (domain.rentalConfig) {
      data.rentalConfig = {
        create: {
          dailyRate: domain.rentalConfig.dailyRate.amount,
          depositAmount: domain.rentalConfig.depositAmount,
          pickupCounty: domain.rentalConfig.pickupCounty,
          pickupCity: domain.rentalConfig.pickupCity,
          fuelPolicy: domain.rentalConfig.fuelPolicy as any,
          minimumRentalDays: domain.rentalConfig.minimumRentalDays,
        }
      };
    }

    return data;
  }
}
