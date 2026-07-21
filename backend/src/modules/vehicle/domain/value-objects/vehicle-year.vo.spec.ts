import { VehicleYear } from './vehicle-year.vo';
import { ValidationError } from '../../../../core/errors/app-error';

describe('VehicleYear Value Object', () => {
  it('should create a valid year', () => {
    const year = new VehicleYear({ value: 2015 });
    expect(year.value).toBe(2015);
  });

  it('should throw ValidationError if year is before 1900', () => {
    expect(() => new VehicleYear({ value: 1899 })).toThrow(ValidationError);
  });

  it('should throw ValidationError if year is in the future (beyond next year)', () => {
    const futureYear = new Date().getFullYear() + 2;
    expect(() => new VehicleYear({ value: futureYear })).toThrow(ValidationError);
  });

  it('should allow current year', () => {
    const currentYear = new Date().getFullYear();
    const year = new VehicleYear({ value: currentYear });
    expect(year.value).toBe(currentYear);
  });

  it('should allow next year', () => {
    const nextYear = new Date().getFullYear() + 1;
    const year = new VehicleYear({ value: nextYear });
    expect(year.value).toBe(nextYear);
  });
});
