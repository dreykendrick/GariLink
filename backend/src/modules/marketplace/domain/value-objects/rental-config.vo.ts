import { ValueObject } from '../../../../shared/domain/value-object.base';
import { DailyRate } from './daily-rate.vo';

export interface RentalConfigProps {
  dailyRate: DailyRate;
  depositAmount: number;
  pickupCounty: string;
  pickupCity: string;
  fuelPolicy: string;
  minimumRentalDays: number;
}

export class RentalConfigVO extends ValueObject<RentalConfigProps> {
  protected validate(): void {
    if (this.props.depositAmount < 0) {
      throw new Error('Deposit amount cannot be negative');
    }
    if (this.props.minimumRentalDays < 1) {
      throw new Error('Minimum rental days must be at least 1');
    }
    if (!this.props.pickupCounty) {
      throw new Error('Pickup county is required');
    }
    if (!this.props.pickupCity) {
      throw new Error('Pickup city is required');
    }
  }

  get dailyRate(): DailyRate { return this.props.dailyRate; }
  get depositAmount(): number { return this.props.depositAmount; }
  get pickupCounty(): string { return this.props.pickupCounty; }
  get pickupCity(): string { return this.props.pickupCity; }
  get fuelPolicy(): string { return this.props.fuelPolicy; }
  get minimumRentalDays(): number { return this.props.minimumRentalDays; }
}
