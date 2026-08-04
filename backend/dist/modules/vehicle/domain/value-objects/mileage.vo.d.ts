import { ValueObject } from '../../../../shared/domain/value-object.base';
export interface MileageProps {
    value: number;
}
export declare class Mileage extends ValueObject<MileageProps> {
    protected validate(): void;
    get value(): number;
}
