import { DomainEvent } from '../../../../shared/domain/domain-event.base';
export declare class ListingPublished extends DomainEvent {
    readonly aggregateId: string;
    constructor(aggregateId: string);
    get eventName(): string;
}
export declare class ListingPaused extends DomainEvent {
    readonly aggregateId: string;
    constructor(aggregateId: string);
    get eventName(): string;
}
export declare class ListingArchived extends DomainEvent {
    readonly aggregateId: string;
    constructor(aggregateId: string);
    get eventName(): string;
}
export declare class ListingRestored extends DomainEvent {
    readonly aggregateId: string;
    constructor(aggregateId: string);
    get eventName(): string;
}
export declare class ListingUpdated extends DomainEvent {
    readonly aggregateId: string;
    readonly updatedFields: string[];
    constructor(aggregateId: string, updatedFields: string[]);
    get eventName(): string;
}
export declare class ListingDeleted extends DomainEvent {
    readonly aggregateId: string;
    constructor(aggregateId: string);
    get eventName(): string;
}
