import { VehicleAvailabilityBlock } from '../../domain/entities/vehicle-availability-block.entity';
export declare class VehicleAvailabilityMapper {
    static toDomain(record: any): VehicleAvailabilityBlock;
    static toPersistence(entity: VehicleAvailabilityBlock): any;
}
