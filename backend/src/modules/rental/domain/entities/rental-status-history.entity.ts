import { Entity } from '../../../../shared/domain/entity.base';
import { RentalStatus } from '@prisma/client';

export class RentalStatusHistory extends Entity<string> {
  constructor(
    id: string,
    public readonly rentalRequestId: string,
    public readonly status: RentalStatus,
    public readonly changedById: string,
    public readonly reason: string | null,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
  }

  static create(params: {
    id: string;
    rentalRequestId: string;
    status: RentalStatus;
    changedById: string;
    reason?: string;
  }): RentalStatusHistory {
    return new RentalStatusHistory(
      params.id,
      params.rentalRequestId,
      params.status,
      params.changedById,
      params.reason ?? null,
      new Date(),
      new Date(),
    );
  }
}