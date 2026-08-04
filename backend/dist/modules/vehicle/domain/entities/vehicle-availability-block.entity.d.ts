import { Entity } from '../../../../shared/domain/entity.base';
import { BlockType } from '@prisma/client';
export interface VehicleAvailabilityBlockProps {
    vehicleId: string;
    startDate: Date;
    endDate: Date;
    type: BlockType;
    reason: string | null;
}
export declare class VehicleAvailabilityBlock extends Entity<string> {
    private _props;
    constructor(id: string, props: VehicleAvailabilityBlockProps, createdAt?: Date, updatedAt?: Date);
    get vehicleId(): string;
    get startDate(): Date;
    get endDate(): Date;
    get type(): BlockType;
    get reason(): string | null;
    get props(): Readonly<VehicleAvailabilityBlockProps>;
    static create(id: string, props: VehicleAvailabilityBlockProps): VehicleAvailabilityBlock;
}
