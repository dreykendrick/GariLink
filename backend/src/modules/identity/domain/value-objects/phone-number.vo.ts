import { ValueObject } from '../../../../shared/domain/value-object.base';
import { ValidationError } from '../../../../core/errors/app-error';

interface PhoneProps { value: string; }

export class PhoneNumber extends ValueObject<PhoneProps> {
  // E.164: starts with +, 7-15 digits total
  private static readonly E164_REGEX = /^\+[1-9]\d{6,14}$/;

  protected validate(): void {
    if (!PhoneNumber.E164_REGEX.test(this.props.value)) {
      throw new ValidationError(
        `"${this.props.value}" is not a valid phone number. Use E.164 format (e.g. +255712345678 or +254712345678)`,
      );
    }
  }

  get value(): string { return this.props.value; }

  static create(phone: string): PhoneNumber {
    let clean = phone.trim();
    // Normalize local 0-prefixed numbers (e.g. 0755123456 -> +255755123456)
    if (clean.startsWith('0') && clean.length >= 10) {
      clean = '+255' + clean.substring(1);
    } else if (!clean.startsWith('+') && clean.length >= 9) {
      clean = '+' + clean;
    }
    return new PhoneNumber({ value: clean });
  }
}
