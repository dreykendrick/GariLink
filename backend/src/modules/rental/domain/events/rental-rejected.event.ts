import { DomainEvent } from '../../../../shared/domain/domain-event.base';

export class RentalRejectedEvent extends DomainEvent {
  constructor(aggregateId: string) {
    super(aggregateId);
  }
  get eventName(): string { return 'RentalRejectedEvent'; }
}