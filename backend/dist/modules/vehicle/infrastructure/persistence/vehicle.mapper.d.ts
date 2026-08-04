import { Vehicle as PrismaVehicle } from '@prisma/client';
import { Vehicle } from '../../domain/entities/vehicle.entity';
export declare class VehicleMapper {
    static toDomain(prismaVehicle: PrismaVehicle): Vehicle;
    static toPersistence(vehicle: Vehicle): PrismaVehicle;
}
