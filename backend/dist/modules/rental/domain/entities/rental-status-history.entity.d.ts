import { Entity } from '../../../../shared/domain/entity.base';
import { RentalStatus } from '@prisma/client';
export declare class RentalStatusHistory extends Entity<string> {
    readonly rentalRequestId: string;
    readonly status: RentalStatus;
    readonly changedById: string;
    readonly reason: string | null;
    constructor(id: string, rentalRequestId: string, status: RentalStatus, changedById: string, reason: string | null, createdAt?: Date, updatedAt?: Date);
    static create(params: {
        id: string;
        rentalRequestId: string;
        status: RentalStatus;
        changedById: string;
        reason?: string;
    }): RentalStatusHistory;
}
