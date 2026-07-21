import { DomainEvent } from '../../../../shared/domain/domain-event.base';

export class RentalApprovedEvent extends DomainEvent {
  constructor(aggregateId: string) {
    super(aggregateId);
  }
  get eventName(): string { return 'RentalApprovedEvent'; }
}