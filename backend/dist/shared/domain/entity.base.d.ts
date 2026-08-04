export declare abstract class Entity<TId = string> {
    readonly id: TId;
    readonly createdAt: Date;
    updatedAt: Date;
    constructor(id: TId, createdAt?: Date, updatedAt?: Date);
    equals(other: Entity<TId>): boolean;
    protected touch(): void;
}
