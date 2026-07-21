import { ValueObject } from '../../../../shared/domain/value-object.base';
import { ValidationError } from '../../../../core/errors/app-error';

export interface SeatsProps {
  value: number;
}

export class Seats extends ValueObject<SeatsProps> {
  protected validate(): void {
    const { value } = this.props;
    if (value === null || value === undefined) {
      throw new ValidationError('Seats must be provided');
    }
    if (value <= 0) {
      throw new ValidationError('Seats must be greater than 0');
    }
  }

  get value(): number {
    return this.props.value;
  }
}
