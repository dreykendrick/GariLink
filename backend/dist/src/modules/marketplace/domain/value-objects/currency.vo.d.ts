import { ValueObject } from '../../../../shared/domain/value-object.base';
export interface CurrencyProps {
    code: string;
}
export declare class Currency extends ValueObject<CurrencyProps> {
    protected validate(): void;
    get code(): string;
}
