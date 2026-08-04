"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleAvailabilityMapper = void 0;
const vehicle_availability_block_entity_1 = require("../../domain/entities/vehicle-availability-block.entity");
class VehicleAvailabilityMapper {
    static toDomain(record) {
        return new vehicle_availability_block_entity_1.VehicleAvailabilityBlock(record.id, {
            vehicleId: record.vehicleId,
            startDate: record.startDate,
            endDate: record.endDate,
            type: record.type,
            reason: record.reason,
        }, record.createdAt);
    }
    static toPersistence(entity) {
        return {
            id: entity.id,
            vehicleId: entity.vehicleId,
            startDate: entity.startDate,
            endDate: entity.endDate,
            type: entity.type,
            reason: entity.reason,
        };
    }
}
exports.VehicleAvailabilityMapper = VehicleAvailabilityMapper;
//# sourceMappingURL=vehicle-availability.mapper.js.map