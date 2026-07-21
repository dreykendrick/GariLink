import { ValueObject } from '../../../../shared/domain/value-object.base';
import { ValidationError } from '../../../../core/errors/app-error';

export interface VehicleYearProps {
  value: number;
}

export class VehicleYear extends ValueObject<VehicleYearProps> {
  protected validate(): void {
    const { value } = this.props;
    if (value === null || value === undefined) {
      throw new ValidationError('Vehicle year must be provided');
    }
    const nextYear = new Date().getFullYear() + 1;
    if (value < 1900 || value > nextYear) {
      throw new ValidationError(`Vehicle year must be between 1900 and ${nextYear}`);
    }
  }

  get value(): number {
    return this.props.value;
  }
}
