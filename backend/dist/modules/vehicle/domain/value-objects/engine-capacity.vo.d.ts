import { ValueObject } from '../../../../shared/domain/value-object.base';
export interface EngineCapacityProps {
    value: number;
}
export declare class EngineCapacity extends ValueObject<EngineCapacityProps> {
    protected validate(): void;
    get value(): number;
}
