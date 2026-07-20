import { ValueObject } from '../../../../shared/domain/value-object.base';
import { ValidationError } from '../../../../core/errors/app-error';

interface PasswordProps { value: string; }

export class Password extends ValueObject<PasswordProps> {
  private static readonly MIN_LENGTH = 8;
  private static readonly UPPERCASE = /[A-Z]/;
  private static readonly LOWERCASE = /[a-z]/;
  private static readonly DIGIT = /[0-9]/;

  protected validate(): void {
    const { value } = this.props;
    if (value.length < Password.MIN_LENGTH) {
      throw new ValidationError(`Password must be at least ${Password.MIN_LENGTH} characters`);
    }
    if (!Password.UPPERCASE.test(value)) {
      throw new ValidationError('Password must contain at least one uppercase letter');
    }
    if (!Password.LOWERCASE.test(value)) {
      throw new ValidationError('Password must contain at least one lowercase letter');
    }
    if (!Password.DIGIT.test(value)) {
      throw new ValidationError('Password must contain at least one digit');
    }
  }

  get value(): string { return this.props.value; }

  static create(password: string): Password {
    return new Password({ value: password });
  }
}
