export declare abstract class ValueObject<T extends object> {
    protected readonly props: T;
    constructor(props: T);
    protected abstract validate(): void;
    equals(other: ValueObject<T>): boolean;
}
