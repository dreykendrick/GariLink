import { ValueObject } from '../../../../shared/domain/value-object.base';
import { ValidationError } from '../../../../core/errors/app-error';

export interface MileageProps {
  value: number;
}

export class Mileage extends ValueObject<MileageProps> {
  protected validate(): void {
    const { value } = this.props;
    if (value === null || value === undefined) {
      throw new ValidationError('Mileage must be provided');
    }
    if (value < 0) {
      throw new ValidationError('Mileage must be greater than or equal to 0');
    }
  }

  get value(): number {
    return this.props.value;
  }
}
