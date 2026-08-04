import { DomainEvent } from '../../../../shared/domain/domain-event.base';
export declare class RentalCompletedEvent extends DomainEvent {
    constructor(aggregateId: string);
    get eventName(): string;
}
