import { DomainEvent } from '../../../../shared/domain/domain-event.base';
import { VehicleStatus } from '@prisma/client';
export declare class VehicleCreatedEvent extends DomainEvent {
    readonly aggregateId: string;
    readonly workspaceId: string;
    constructor(aggregateId: string, workspaceId: string);
    get eventName(): string;
}
export declare class VehicleUpdatedEvent extends DomainEvent {
    readonly aggregateId: string;
    readonly updatedFields: string[];
    constructor(aggregateId: string, updatedFields: string[]);
    get eventName(): string;
}
export declare class VehicleArchivedEvent extends DomainEvent {
    readonly aggregateId: string;
    constructor(aggregateId: string);
    get eventName(): string;
}
export declare class VehicleDeletedEvent extends DomainEvent {
    readonly aggregateId: string;
    constructor(aggregateId: string);
    get eventName(): string;
}
export declare class VehicleStatusChangedEvent extends DomainEvent {
    readonly aggregateId: string;
    readonly oldStatus: VehicleStatus;
    readonly newStatus: VehicleStatus;
    constructor(aggregateId: string, oldStatus: VehicleStatus, newStatus: VehicleStatus);
    get eventName(): string;
}
