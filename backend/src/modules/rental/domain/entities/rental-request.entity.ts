import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { RentalStatus, Currency } from '@prisma/client';
import { RentalApprovedEvent } from '../events/rental-approved.event';
import { RentalRejectedEvent } from '../events/rental-rejected.event';
import { RentalCancelledEvent } from '../events/rental-cancelled.event';
import { RentalReadyEvent } from '../events/rental-ready.event';
import { RentalStartedEvent } from '../events/rental-started.event';
import { RentalCompletedEvent } from '../events/rental-completed.event';
import { InvalidRentalTransitionError } from '../errors/rental.errors';

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

export class RentalRequest extends AggregateRoot<string> {
  private _status: RentalStatus;
  private _props: RentalRequestProps;

  constructor(id: string, props: RentalRequestProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this._status = props.status;
    this._props = props;
  }

  get status(): RentalStatus { return this._status; }
  get customerId(): string { return this._props.customerId; }
  get workspaceId(): string { return this._props.workspaceId; }
  get vehicleId(): string { return this._props.vehicleId; }
  get listingId(): string { return this._props.listingId; }
  get startDate(): Date { return this._props.startDate; }
  get endDate(): Date { return this._props.endDate; }

  approve(reason?: string): void {
    if (this._status !== RentalStatus.REQUESTED && this._status !== RentalStatus.UNDER_REVIEW) {
      throw new InvalidRentalTransitionError();
    }
    this._status = RentalStatus.APPROVED;
    this.touch();
    this.addDomainEvent(new RentalApprovedEvent(this.id));
  }

  reject(reason?: string): void {
    if (this._status !== RentalStatus.REQUESTED && this._status !== RentalStatus.UNDER_REVIEW) {
      throw new InvalidRentalTransitionError();
    }
    this._status = RentalStatus.REJECTED;
    if (reason) this._props.rejectionReason = reason;
    this.touch();
    this.addDomainEvent(new RentalRejectedEvent(this.id));
  }

  cancel(): void {
    if (this._status === RentalStatus.COMPLETED || this._status === RentalStatus.ACTIVE) {
      throw new InvalidRentalTransitionError();
    }
    this._status = RentalStatus.CANCELLED;
    this.touch();
    this.addDomainEvent(new RentalCancelledEvent(this.id));
  }

  markReady(): void {
    if (this._status !== RentalStatus.APPROVED) {
      throw new InvalidRentalTransitionError();
    }
    this._status = RentalStatus.READY_FOR_PICKUP;
    this.touch();
    this.addDomainEvent(new RentalReadyEvent(this.id));
  }

  start(): void {
    if (this._status !== RentalStatus.READY_FOR_PICKUP) {
      throw new InvalidRentalTransitionError();
    }
    this._status = RentalStatus.ACTIVE;
    this.touch();
    this.addDomainEvent(new RentalStartedEvent(this.id));
  }

  complete(): void {
    if (this._status !== RentalStatus.ACTIVE) {
      throw new InvalidRentalTransitionError();
    }
    this._status = RentalStatus.COMPLETED;
    this.touch();
    this.addDomainEvent(new RentalCompletedEvent(this.id));
  }

  static create(id: string, props: RentalRequestProps): RentalRequest {
    return new RentalRequest(id, props);
  }
}