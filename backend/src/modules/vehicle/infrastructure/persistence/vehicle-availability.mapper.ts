import { VehicleAvailabilityBlock } from '../../domain/entities/vehicle-availability-block.entity';

export class VehicleAvailabilityMapper {
  static toDomain(record: any): VehicleAvailabilityBlock {
    return new VehicleAvailabilityBlock(
      record.id,
      {
        vehicleId: record.vehicleId,
        startDate: record.startDate,
        endDate: record.endDate,
        type: record.type,
        reason: record.reason,
      },
      record.createdAt
    );
  }

  static toPersistence(entity: VehicleAvailabilityBlock): any {
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
