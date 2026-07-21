import { ValueObject } from '../../../../shared/domain/value-object.base';
import { ValidationError } from '../../../../core/errors/app-error';

export interface EngineCapacityProps {
  value: number;
}

export class EngineCapacity extends ValueObject<EngineCapacityProps> {
  protected validate(): void {
    const { value } = this.props;
    if (value === null || value === undefined) {
      throw new ValidationError('Engine capacity must be provided');
    }
    if (value <= 0) {
      throw new ValidationError('Engine capacity must be greater than 0');
    }
  }

  get value(): number {
    return this.props.value;
  }
}
