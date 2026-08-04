import { ValueObject } from '../../../../shared/domain/value-object.base';
import { DailyRate } from './daily-rate.vo';
export interface RentalConfigProps {
    dailyRate: DailyRate;
    depositAmount: number;
    pickupCounty: string;
    pickupCity: string;
    fuelPolicy: string;
    minimumRentalDays: number;
}
export declare class RentalConfigVO extends ValueObject<RentalConfigProps> {
    protected validate(): void;
    get dailyRate(): DailyRate;
    get depositAmount(): number;
    get pickupCounty(): string;
    get pickupCity(): string;
    get fuelPolicy(): string;
    get minimumRentalDays(): number;
}
