import { BlockType } from '@prisma/client';
export declare class BlockVehicleDatesDto {
    startDate: string;
    endDate: string;
    type: BlockType;
    reason?: string;
}
