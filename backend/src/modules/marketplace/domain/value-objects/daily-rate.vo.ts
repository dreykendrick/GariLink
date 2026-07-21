import { ValueObject } from '../../../../shared/domain/value-object.base';
import { Currency } from './currency.vo';

export interface DailyRateProps {
  amount: number;
  currency: Currency;
}

export class DailyRate extends ValueObject<DailyRateProps> {
  protected validate(): void {
    if (this.props.amount < 0) {
      throw new Error('Daily rate amount cannot be negative');
    }
  }

  get amount(): number {
    return this.props.amount;
  }

  get currency(): Currency {
    return this.props.currency;
  }
}
