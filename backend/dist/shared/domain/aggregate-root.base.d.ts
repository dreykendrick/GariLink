import { Entity } from './entity.base';
import { DomainEvent } from './domain-event.base';
export declare abstract class AggregateRoot<TId = string> extends Entity<TId> {
    private _domainEvents;
    get domainEvents(): ReadonlyArray<DomainEvent>;
    protected addDomainEvent(event: DomainEvent): void;
    clearDomainEvents(): void;
}
