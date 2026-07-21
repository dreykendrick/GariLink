import { RegistrationNumber } from './registration-number.vo';
import { ValidationError } from '../../../../core/errors/app-error';

describe('RegistrationNumber Value Object', () => {
  it('should create a valid registration number', () => {
    const reg = new RegistrationNumber({ value: 'KCA 123A' });
    expect(reg.value).toBe('KCA 123A');
  });

  it('should format registration number to uppercase', () => {
    const reg = new RegistrationNumber({ value: 'kca 123a' });
    expect(reg.value).toBe('KCA 123A');
  });

  it('should throw ValidationError if empty string', () => {
    expect(() => new RegistrationNumber({ value: '' })).toThrow(ValidationError);
  });

  it('should throw ValidationError if it contains invalid characters', () => {
    expect(() => new RegistrationNumber({ value: 'KCA@123A' })).toThrow(ValidationError);
  });
});
