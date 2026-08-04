import { DomainEvent } from '../../../../shared/domain/domain-event.base';
export declare class RentalRejectedEvent extends DomainEvent {
    constructor(aggregateId: string);
    get eventName(): string;
}
