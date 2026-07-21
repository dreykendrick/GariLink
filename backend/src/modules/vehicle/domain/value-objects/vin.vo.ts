import { ValueObject } from '../../../../shared/domain/value-object.base';
import { ValidationError } from '../../../../core/errors/app-error';

export interface VinProps {
  value: string;
}

export class Vin extends ValueObject<VinProps> {
  protected validate(): void {
    const { value } = this.props;
    if (!value) {
      throw new ValidationError('VIN cannot be empty');
    }
    if (value.length !== 17) {
      throw new ValidationError('VIN must be exactly 17 characters long');
    }
  }

  get value(): string {
    return this.props.value;
  }
}
