import { ValueObject } from '../../../../shared/domain/value-object.base';
import { ValidationError } from '../../../../core/errors/app-error';

interface PhoneProps { value: string; }

export class PhoneNumber extends ValueObject<PhoneProps> {
  // E.164: starts with +, 7-15 digits total
  private static readonly E164_REGEX = /^\+[1-9]\d{6,14}$/;

  protected validate(): void {
    if (!PhoneNumber.E164_REGEX.test(this.props.value)) {
      throw new ValidationError(
        `"${this.props.value}" is not a valid phone number. Use E.164 format (e.g. +254712345678)`,
      );
    }
  }

  get value(): string { return this.props.value; }

  static create(phone: string): PhoneNumber {
    return new PhoneNumber({ value: phone.trim() });
  }
}
