import { VehicleAvailabilityBlock } from '../entities/vehicle-availability-block.entity';
export interface IVehicleAvailabilityRepository {
    save(block: VehicleAvailabilityBlock): Promise<void>;
    findOverlappingBlocks(vehicleId: string, startDate: Date, endDate: Date): Promise<VehicleAvailabilityBlock[]>;
    findByVehicleId(vehicleId: string): Promise<VehicleAvailabilityBlock[]>;
}
