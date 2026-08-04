export declare abstract class DomainEvent {
    readonly aggregateId: string;
    readonly occurredAt: Date;
    constructor(aggregateId: string);
    abstract get eventName(): string;
}
