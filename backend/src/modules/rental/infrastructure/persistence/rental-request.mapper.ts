import { RentalRequest as PrismaRentalRequest } from '@prisma/client';
import { RentalRequest } from '../../domain/entities/rental-request.entity';

export class RentalRequestMapper {
  static toDomain(raw: PrismaRentalRequest): RentalRequest {
    return RentalRequest.create(raw.id, {
      customerId: raw.customerId,
      workspaceId: raw.workspaceId,
      vehicleId: raw.vehicleId,
      listingId: raw.listingId,
      status: raw.status,
      startDate: raw.startDate,
      endDate: raw.endDate,
      dailyRate: Number(raw.dailyRate),
      currency: raw.currency,
      totalAmount: Number(raw.totalAmount),
      depositAmount: raw.depositAmount ? Number(raw.depositAmount) : null,
      pickupNotes: raw.pickupNotes,
      rejectionReason: raw.rejectionReason,
    });
  }

  static toPersistence(domain: RentalRequest): any {
    return {
      id: domain.id,
      customerId: (domain as any)._props.customerId,
      workspaceId: (domain as any)._props.workspaceId,
      vehicleId: (domain as any)._props.vehicleId,
      listingId: (domain as any)._props.listingId,
      status: domain.status,
      startDate: domain.startDate,
      endDate: domain.endDate,
      dailyRate: (domain as any)._props.dailyRate,
      currency: (domain as any)._props.currency,
      totalAmount: (domain as any)._props.totalAmount,
      depositAmount: (domain as any)._props.depositAmount,
      pickupNotes: (domain as any)._props.pickupNotes,
      rejectionReason: (domain as any)._props.rejectionReason,
    };
  }
}