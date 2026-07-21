import { Entity } from '../../../../shared/domain/entity.base';
import { BlockType } from '@prisma/client';

export interface VehicleAvailabilityBlockProps {
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  type: BlockType;
  reason: string | null;
}

export class VehicleAvailabilityBlock extends Entity<string> {
  private _props: VehicleAvailabilityBlockProps;

  constructor(id: string, props: VehicleAvailabilityBlockProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this._props = { ...props };
  }

  get vehicleId(): string { return this._props.vehicleId; }
  get startDate(): Date { return this._props.startDate; }
  get endDate(): Date { return this._props.endDate; }
  get type(): BlockType { return this._props.type; }
  get reason(): string | null { return this._props.reason; }

  get props(): Readonly<VehicleAvailabilityBlockProps> {
    return { ...this._props };
  }

  static create(id: string, props: VehicleAvailabilityBlockProps): VehicleAvailabilityBlock {
    return new VehicleAvailabilityBlock(id, props);
  }
}
