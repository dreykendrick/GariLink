import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { Vehicle } from '../../domain/entities/vehicle.entity';
export declare class PrismaVehicleRepository implements IVehicleRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<Vehicle | null>;
    findByVin(vin: string): Promise<Vehicle | null>;
    findByRegistrationNumber(registrationNumber: string): Promise<Vehicle | null>;
    findByWorkspaceId(workspaceId: string, limit: number, offset: number): Promise<{
        data: Vehicle[];
        total: number;
    }>;
    save(vehicle: Vehicle): Promise<void>;
    delete(id: string): Promise<void>;
    findAll(limit: number, offset: number): Promise<{
        data: Vehicle[];
        total: number;
    }>;
}
