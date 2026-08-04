import { ValueObject } from '../../../../shared/domain/value-object.base';
export interface SeatsProps {
    value: number;
}
export declare class Seats extends ValueObject<SeatsProps> {
    protected validate(): void;
    get value(): number;
}
