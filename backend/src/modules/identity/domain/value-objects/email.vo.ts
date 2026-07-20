import { ValueObject } from '../../../../shared/domain/value-object.base';
import { ValidationError } from '../../../../core/errors/app-error';

interface EmailProps { value: string; }

export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  protected validate(): void {
    if (!Email.EMAIL_REGEX.test(this.props.value)) {
      throw new ValidationError(`"${this.props.value}" is not a valid email address`);
    }
  }

  get value(): string { return this.props.value; }

  static create(email: string): Email {
    return new Email({ value: email.toLowerCase().trim() });
  }
}
