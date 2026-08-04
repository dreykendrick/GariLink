import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { RentalStatus, Currency } from '@prisma/client';
export interface RentalRequestProps {
    customerId: string;
    workspaceId: string;
    vehicleId: string;
    listingId: string;
    status: RentalStatus;
    startDate: Date;
    endDate: Date;
    dailyRate: number;
    currency: Currency;
    totalAmount: number;
    depositAmount: number | null;
    pickupNotes: string | null;
    rejectionReason: string | null;
}
export declare class RentalRequest extends AggregateRoot<string> {
    private _status;
    private _props;
    constructor(id: string, props: RentalRequestProps, createdAt?: Date, updatedAt?: Date);
    get status(): RentalStatus;
    get customerId(): string;
    get workspaceId(): string;
    get vehicleId(): string;
    get listingId(): string;
    get startDate(): Date;
    get endDate(): Date;
    approve(reason?: string): void;
    reject(reason?: string): void;
    cancel(): void;
    markReady(): void;
    start(): void;
    complete(): void;
    static create(id: string, props: RentalRequestProps): RentalRequest;
}
