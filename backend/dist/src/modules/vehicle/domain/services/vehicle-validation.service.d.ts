import { VehicleStatus } from '@prisma/client';
export declare class VehicleValidationService {
    static validateStatusTransition(currentStatus: VehicleStatus, newStatus: VehicleStatus): void;
}
