import { ValueObject } from '../../../../shared/domain/value-object.base';
export interface VinProps {
    value: string;
}
export declare class Vin extends ValueObject<VinProps> {
    protected validate(): void;
    get value(): string;
}
