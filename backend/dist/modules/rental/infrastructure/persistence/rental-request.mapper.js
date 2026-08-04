"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalRequestMapper = void 0;
const rental_request_entity_1 = require("../../domain/entities/rental-request.entity");
class RentalRequestMapper {
    static toDomain(raw) {
        return rental_request_entity_1.RentalRequest.create(raw.id, {
            customerId: raw.customerId,
            workspaceId: raw.workspaceId,
            vehicleId: raw.vehicleId,
            listingId: raw.listingId,
            status: raw.status,
            startDate: raw.startDate,
            endDate: raw.endDate,
            dailyRate: Number(raw.dailyRate),
            currency: raw.currency,
            totalAmount: Number(raw.totalAmount),
            depositAmount: raw.depositAmount ? Number(raw.depositAmount) : null,
            pickupNotes: raw.pickupNotes,
            rejectionReason: raw.rejectionReason,
        });
    }
    static toPersistence(domain) {
        return {
            id: domain.id,
            customerId: domain._props.customerId,
            workspaceId: domain._props.workspaceId,
            vehicleId: domain._props.vehicleId,
            listingId: domain._props.listingId,
            status: domain.status,
            startDate: domain.startDate,
            endDate: domain.endDate,
            dailyRate: domain._props.dailyRate,
            currency: domain._props.currency,
            totalAmount: domain._props.totalAmount,
            depositAmount: domain._props.depositAmount,
            pickupNotes: domain._props.pickupNotes,
            rejectionReason: domain._props.rejectionReason,
        };
    }
}
exports.RentalRequestMapper = RentalRequestMapper;
//# sourceMappingURL=rental-request.mapper.js.map