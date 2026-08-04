import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IVehicleAvailabilityRepository } from '../../domain/repositories/vehicle-availability.repository.interface';
import { VehicleAvailabilityBlock } from '../../domain/entities/vehicle-availability-block.entity';
export declare class PrismaVehicleAvailabilityRepository implements IVehicleAvailabilityRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    save(block: VehicleAvailabilityBlock): Promise<void>;
    findOverlappingBlocks(vehicleId: string, startDate: Date, endDate: Date): Promise<VehicleAvailabilityBlock[]>;
    findByVehicleId(vehicleId: string): Promise<VehicleAvailabilityBlock[]>;
}
