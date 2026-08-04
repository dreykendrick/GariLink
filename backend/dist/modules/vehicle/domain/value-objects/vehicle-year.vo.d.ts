import { ValueObject } from '../../../../shared/domain/value-object.base';
export interface VehicleYearProps {
    value: number;
}
export declare class VehicleYear extends ValueObject<VehicleYearProps> {
    protected validate(): void;
    get value(): number;
}
