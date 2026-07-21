import { DomainEvent } from '../../../../shared/domain/domain-event.base';

export class RentalReadyEvent extends DomainEvent {
  constructor(aggregateId: string) {
    super(aggregateId);
  }
  get eventName(): string { return 'RentalReadyEvent'; }
}