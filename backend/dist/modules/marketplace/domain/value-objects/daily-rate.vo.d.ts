import { ValueObject } from '../../../../shared/domain/value-object.base';
import { Currency } from './currency.vo';
export interface DailyRateProps {
    amount: number;
    currency: Currency;
}
export declare class DailyRate extends ValueObject<DailyRateProps> {
    protected validate(): void;
    get amount(): number;
    get currency(): Currency;
}
