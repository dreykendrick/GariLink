import { DomainEvent } from '../../../../shared/domain/domain-event.base';

export class ListingPublished extends DomainEvent {
  constructor(public readonly aggregateId: string) {
    super(aggregateId);
  }
  get eventName(): string { return 'ListingPublished'; }
}

export class ListingPaused extends DomainEvent {
  constructor(public readonly aggregateId: string) {
    super(aggregateId);
  }
  get eventName(): string { return 'ListingPaused'; }
}

export class ListingArchived extends DomainEvent {
  constructor(public readonly aggregateId: string) {
    super(aggregateId);
  }
  get eventName(): string { return 'ListingArchived'; }
}

export class ListingRestored extends DomainEvent {
  constructor(public readonly aggregateId: string) {
    super(aggregateId);
  }
  get eventName(): string { return 'ListingRestored'; }
}

export class ListingUpdated extends DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly updatedFields: string[]
  ) {
    super(aggregateId);
  }
  get eventName(): string { return 'ListingUpdated'; }
}

export class ListingDeleted extends DomainEvent {
  constructor(public readonly aggregateId: string) {
    super(aggregateId);
  }
  get eventName(): string { return 'ListingDeleted'; }
}
