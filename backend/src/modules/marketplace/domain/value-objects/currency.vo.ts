import { ValueObject } from '../../../../shared/domain/value-object.base';

export interface CurrencyProps {
  code: string; // e.g. KES, USD
}

export class Currency extends ValueObject<CurrencyProps> {
  protected validate(): void {
    if (!this.props.code || this.props.code.length !== 3) {
      throw new Error('Currency code must be 3 characters long');
    }
  }

  get code(): string {
    return this.props.code;
  }
}
