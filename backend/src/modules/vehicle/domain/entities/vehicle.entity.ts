import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { VehicleStatus, FuelType, Transmission, BodyType, VehicleCategory, Drivetrain, VehicleCondition } from '@prisma/client';

export interface VehicleProps {
  workspaceId: string;
  category: VehicleCategory;
  bodyType: BodyType;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  fuelType: FuelType;
  transmission: Transmission;
  drivetrain: Drivetrain;
  engineCapacity: number | null;
  doors: number | null;
  seats: number | null;
  condition: VehicleCondition;
  mileage: number;
  exteriorColor: string | null;
  interiorColor: string | null;
  vin: string | null;
  registrationNumber: string | null;
  features: string[];
  description: string | null;
  status: VehicleStatus;
  isVerified: boolean;
  geofenceEnabled: boolean;
}

export class Vehicle extends AggregateRoot<string> {
  private _props: VehicleProps;

  constructor(id: string, props: VehicleProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this._props = { ...props };
  }

  // ─── Getters ──────────────────────────────────────────────────────────
  get workspaceId(): string { return this._props.workspaceId; }
  get make(): string { return this._props.make; }
  get model(): string { return this._props.model; }
  get year(): number { return this._props.year; }
  get trim(): string | null { return this._props.trim; }
  get vin(): string | null { return this._props.vin; }
  get registrationNumber(): string | null { return this._props.registrationNumber; }
  get exteriorColor(): string | null { return this._props.exteriorColor; }
  get fuelType(): FuelType { return this._props.fuelType; }
  get transmission(): Transmission { return this._props.transmission; }
  get bodyType(): BodyType { return this._props.bodyType; }
  get mileage(): number { return this._props.mileage; }
  get status(): VehicleStatus { return this._props.status; }
  get features(): string[] { return [...this._props.features]; }

  // All props for persistence
  get props(): Readonly<VehicleProps> { return { ...this._props }; }

  // ─── Domain methods ───────────────────────────────────────────────────

  update(fields: Partial<Omit<VehicleProps, 'workspaceId'>>): void {
    this._props = { ...this._props, ...fields };
    this.touch();
  }

  updateStatus(status: VehicleStatus): void {
    this._props.status = status;
    this.touch();
  }

  updateMileage(km: number): void {
    if (km < 0) {
      throw new Error('Mileage cannot be negative');
    }
    this._props.mileage = km;
    this.touch();
  }

  retire(): void {
    this._props.status = VehicleStatus.SCRAPPED;
    this.touch();
  }

  get displayTitle(): string {
    return `${this._props.year} ${this._props.make} ${this._props.model}${
      this._props.trim ? ` ${this._props.trim}` : ''
    }`;
  }

  static create(id: string, props: VehicleProps): Vehicle {
    return new Vehicle(id, {
      ...props,
      status: props.status ?? VehicleStatus.AVAILABLE,
      features: props.features ?? [],
    });
  }
}
