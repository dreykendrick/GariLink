import { ValueObject } from '../../../../shared/domain/value-object.base';
import { ValidationError } from '../../../../core/errors/app-error';

export interface RegistrationNumberProps {
  value: string;
}

export class RegistrationNumber extends ValueObject<RegistrationNumberProps> {
  protected validate(): void {
    const { value } = this.props;
    if (!value) {
      throw new ValidationError('Registration number cannot be empty');
    }
    const regex = /^[A-Z0-9 ]+$/;
    if (!regex.test(value)) {
      throw new ValidationError('Registration number must contain only uppercase alphanumeric characters and spaces');
    }
  }

  get value(): string {
    return this.props.value;
  }
}
