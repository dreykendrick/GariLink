import { DomainEvent } from '../../../../shared/domain/domain-event.base';
export declare class RentalApprovedEvent extends DomainEvent {
    constructor(aggregateId: string);
    get eventName(): string;
}
