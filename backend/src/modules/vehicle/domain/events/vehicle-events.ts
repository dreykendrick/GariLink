import { DomainEvent } from '../../../../shared/domain/domain-event.base';
import { VehicleStatus } from '@prisma/client';

export class VehicleCreatedEvent extends DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly workspaceId: string
  ) {
    super(aggregateId);
  }

  get eventName(): string {
    return 'VehicleCreatedEvent';
  }
}

export class VehicleUpdatedEvent extends DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly updatedFields: string[]
  ) {
    super(aggregateId);
  }

  get eventName(): string {
    return 'VehicleUpdatedEvent';
  }
}

export class VehicleArchivedEvent extends DomainEvent {
  constructor(public readonly aggregateId: string) {
    super(aggregateId);
  }

  get eventName(): string {
    return 'VehicleArchivedEvent';
  }
}

export class VehicleDeletedEvent extends DomainEvent {
  constructor(public readonly aggregateId: string) {
    super(aggregateId);
  }

  get eventName(): string {
    return 'VehicleDeletedEvent';
  }
}

export class VehicleStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly oldStatus: VehicleStatus,
    public readonly newStatus: VehicleStatus
  ) {
    super(aggregateId);
  }

  get eventName(): string {
    return 'VehicleStatusChangedEvent';
  }
}
