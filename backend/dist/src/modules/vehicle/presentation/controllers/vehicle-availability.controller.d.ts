import { AccessJwtPayload } from '../../../../core/security/token.service';
import { BlockVehicleDatesDto } from '../../application/dto/vehicle-availability.dto';
import { BlockVehicleDatesUseCase } from '../../application/use-cases/block-vehicle-dates.use-case';
import { GetVehicleAvailabilityUseCase } from '../../application/use-cases/get-vehicle-availability.use-case';
export declare class VehicleAvailabilityController {
    private readonly blockVehicleDatesUseCase;
    private readonly getVehicleAvailabilityUseCase;
    constructor(blockVehicleDatesUseCase: BlockVehicleDatesUseCase, getVehicleAvailabilityUseCase: GetVehicleAvailabilityUseCase);
    blockDates(vehicleId: string, dto: BlockVehicleDatesDto, user: AccessJwtPayload): Promise<{
        vehicleId: string;
        startDate: Date;
        endDate: Date;
        type: import("@prisma/client").BlockType;
        reason: string | null;
        id: string;
    }>;
    getAvailability(vehicleId: string, user: AccessJwtPayload): Promise<{
        vehicleId: string;
        startDate: Date;
        endDate: Date;
        type: import("@prisma/client").BlockType;
        reason: string | null;
        id: string;
    }[]>;
}
