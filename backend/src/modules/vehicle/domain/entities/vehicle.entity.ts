import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { 
  VehicleStatus, 
  FuelType, 
  Transmission, 
  BodyType, 
  VehicleType, 
  Drivetrain, 
  VehicleCondition 
} from '@prisma/client';
import { RegistrationNumber } from '../value-objects/registration-number.vo';
import { Vin } from '../value-objects/vin.vo';
import { EngineCapacity } from '../value-objects/engine-capacity.vo';
import { Mileage } from '../value-objects/mileage.vo';
import { VehicleYear } from '../value-objects/vehicle-year.vo';
import { Seats } from '../value-objects/seats.vo';
import { 
  VehicleCreatedEvent, 
  VehicleUpdatedEvent, 
  VehicleArchivedEvent, 
  VehicleStatusChangedEvent 
} from '../events/vehicle-events';
import { VehicleValidationService } from '../services/vehicle-validation.service';

export interface VehicleProps {
  workspaceId: string;
  type: VehicleType;
  bodyType: BodyType;
  make: string;
  model: string;
  year: VehicleYear;
  trim: string | null;
  fuelType: FuelType;
  transmission: Transmission;
  drivetrain: Drivetrain;
  engineCapacity: EngineCapacity | null;
  engineNumber: string | null;
  horsepower: number | null;
  torque: number | null;
  fuelTankCapacity: number | null;
  groundClearance: number | null;
  wheelbase: number | null;
  doors: number | null;
  seats: Seats | null;
  condition: VehicleCondition;
  mileage: Mileage;
  exteriorColor: string | null;
  interiorColor: string | null;
  vin: Vin | null;
  registrationNumber: RegistrationNumber | null;
  features: string[];
  description: string | null;
  primaryImageId: string | null;
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
  get type(): VehicleType { return this._props.type; }
  get bodyType(): BodyType { return this._props.bodyType; }
  get make(): string { return this._props.make; }
  get model(): string { return this._props.model; }
  get year(): VehicleYear { return this._props.year; }
  get trim(): string | null { return this._props.trim; }
  get fuelType(): FuelType { return this._props.fuelType; }
  get transmission(): Transmission { return this._props.transmission; }
  get drivetrain(): Drivetrain { return this._props.drivetrain; }
  get engineCapacity(): EngineCapacity | null { return this._props.engineCapacity; }
  get engineNumber(): string | null { return this._props.engineNumber; }
  get horsepower(): number | null { return this._props.horsepower; }
  get torque(): number | null { return this._props.torque; }
  get fuelTankCapacity(): number | null { return this._props.fuelTankCapacity; }
  get groundClearance(): number | null { return this._props.groundClearance; }
  get wheelbase(): number | null { return this._props.wheelbase; }
  get doors(): number | null { return this._props.doors; }
  get seats(): Seats | null { return this._props.seats; }
  get condition(): VehicleCondition { return this._props.condition; }
  get mileage(): Mileage { return this._props.mileage; }
  get exteriorColor(): string | null { return this._props.exteriorColor; }
  get interiorColor(): string | null { return this._props.interiorColor; }
  get vin(): Vin | null { return this._props.vin; }
  get registrationNumber(): RegistrationNumber | null { return this._props.registrationNumber; }
  get features(): string[] { return [...this._props.features]; }
  get description(): string | null { return this._props.description; }
  get primaryImageId(): string | null { return this._props.primaryImageId; }
  get status(): VehicleStatus { return this._props.status; }
  get isVerified(): boolean { return this._props.isVerified; }
  get geofenceEnabled(): boolean { return this._props.geofenceEnabled; }

  // All props for persistence
  get props(): Readonly<VehicleProps> { return { ...this._props }; }

  // ─── Domain methods ───────────────────────────────────────────────────

  update(fields: Partial<Omit<VehicleProps, 'workspaceId'>>): void {
    const updatedFields = Object.keys(fields);
    this._props = { ...this._props, ...fields };
    this.touch();
    this.addDomainEvent(new VehicleUpdatedEvent(this.id, updatedFields));
  }

  updateStatus(newStatus: VehicleStatus): void {
    const oldStatus = this._props.status;
    VehicleValidationService.validateStatusTransition(oldStatus, newStatus);
    
    this._props.status = newStatus;
    this.touch();
    
    this.addDomainEvent(new VehicleStatusChangedEvent(this.id, oldStatus, newStatus));

    if (newStatus === VehicleStatus.ARCHIVED) {
      this.addDomainEvent(new VehicleArchivedEvent(this.id));
    }
  }

  updateMileage(km: number): void {
    this._props.mileage = new Mileage({ value: km });
    this.touch();
    this.addDomainEvent(new VehicleUpdatedEvent(this.id, ['mileage']));
  }

  retire(): void {
    this.updateStatus(VehicleStatus.RETIRED);
  }

  get displayTitle(): string {
    return `${this._props.year.value} ${this._props.make} ${this._props.model}${
      this._props.trim ? ` ${this._props.trim}` : ''
    }`;
  }

  static create(id: string, props: VehicleProps): Vehicle {
    const vehicle = new Vehicle(id, {
      ...props,
      status: props.status ?? VehicleStatus.DRAFT,
      features: props.features ?? [],
    });
    
    vehicle.addDomainEvent(new VehicleCreatedEvent(vehicle.id, vehicle.workspaceId));
    
    return vehicle;
  }
}
