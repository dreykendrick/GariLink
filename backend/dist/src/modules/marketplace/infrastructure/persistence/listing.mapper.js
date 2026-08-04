"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingMapper = void 0;
const listing_entity_1 = require("../../domain/entities/listing.entity");
const rental_config_vo_1 = require("../../domain/value-objects/rental-config.vo");
const daily_rate_vo_1 = require("../../domain/value-objects/daily-rate.vo");
const currency_vo_1 = require("../../domain/value-objects/currency.vo");
class ListingMapper {
    static toDomain(record) {
        let rentalConfig;
        if (record.rentalConfig) {
            const currency = new currency_vo_1.Currency({ code: record.currency });
            const dailyRate = new daily_rate_vo_1.DailyRate({ amount: Number(record.rentalConfig.dailyRate), currency });
            rentalConfig = new rental_config_vo_1.RentalConfigVO({
                dailyRate,
                depositAmount: Number(record.rentalConfig.depositAmount),
                pickupCounty: record.rentalConfig.pickupCounty,
                pickupCity: record.rentalConfig.pickupCity || '',
                fuelPolicy: record.rentalConfig.fuelPolicy,
                minimumRentalDays: record.rentalConfig.minimumRentalDays,
            });
        }
        return listing_entity_1.Listing.create(record.id, {
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
            tags: record.tags,
            county: record.county,
            country: record.country,
            searchVector: null,
            deletedAt: record.deletedAt,
            rentalConfig,
            vehicle: record.vehicle ? record.vehicle : undefined,
        });
    }
    static toPersistence(domain) {
        const data = {
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
                    fuelPolicy: domain.rentalConfig.fuelPolicy,
                    minimumRentalDays: domain.rentalConfig.minimumRentalDays,
                }
            };
        }
        return data;
    }
}
exports.ListingMapper = ListingMapper;
//# sourceMappingURL=listing.mapper.js.map