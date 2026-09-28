import { Injectable } from "@nestjs/common";
import { BlockType, RentalStatus } from "@prisma/client";
import { ConflictError } from "../../../../core/errors/app-error";
import { PrismaService } from "../../../../shared/infrastructure/prisma.service";
import { IRentalRequestRepository } from "../../domain/repositories/rental-request.repository.interface";
import { RentalRequest } from "../../domain/entities/rental-request.entity";
import { RentalRequestMapper } from "./rental-request.mapper";

@Injectable()
export class PrismaRentalRequestRepository implements IRentalRequestRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<RentalRequest | null> {
    const raw = await this.prisma.rentalRequest.findUnique({ where: { id } });
    if (!raw) return null;
    return RentalRequestMapper.toDomain(raw);
  }

  async findByCustomerId(customerId: string): Promise<RentalRequest[]> {
    const raw = await this.prisma.rentalRequest.findMany({
      where: { customerId },
    });
    return raw.map(RentalRequestMapper.toDomain);
  }

  async findByWorkspaceId(workspaceId: string): Promise<RentalRequest[]> {
    const raw = await this.prisma.rentalRequest.findMany({
      where: { workspaceId },
    });
    return raw.map(RentalRequestMapper.toDomain);
  }

  async save(rental: RentalRequest): Promise<void> {
    const data = RentalRequestMapper.toPersistence(rental);

    await this.prisma.$transaction(async (tx) => {
      // Every rental writer locks the same vehicle before checking dates. This
      // closes the gap between the initial availability query and persistence.
      await tx.$queryRaw`SELECT id FROM vehicles WHERE id = ${rental.vehicleId} FOR UPDATE`;
      const existing = await tx.rentalRequest.findUnique({
        where: { id: rental.id },
      });
      if (existing && existing.status !== rental.originalStatus) {
        throw new ConflictError(
          "This booking has changed. Refresh it before trying again.",
        );
      }
      const blockingStatuses: RentalStatus[] = [
        RentalStatus.REQUESTED,
        RentalStatus.UNDER_REVIEW,
        RentalStatus.APPROVED,
        RentalStatus.READY_FOR_PICKUP,
        RentalStatus.ACTIVE,
      ];
      const blockReason = `Rental Request: ${rental.id}`;
      if (
        (!existing || existing.status !== rental.status) &&
        blockingStatuses.includes(rental.status)
      ) {
        const overlap = {
          vehicleId: rental.vehicleId,
          startDate: { lt: rental.endDate },
          endDate: { gt: rental.startDate },
        };
        const conflict = await tx.rentalRequest.findFirst({
          where: {
            ...overlap,
            id: { not: rental.id },
            status: { in: blockingStatuses },
          },
          select: { id: true },
        });
        const blocked = await tx.vehicleAvailabilityBlock.findFirst({
          where: {
            ...overlap,
            OR: [{ reason: null }, { reason: { not: blockReason } }],
          },
          select: { id: true },
        });
        if (conflict || blocked)
          throw new ConflictError(
            "This vehicle is unavailable for the selected dates",
          );
      }
      await tx.rentalRequest.upsert({
        where: { id: rental.id },
        update: data,
        create: data,
      });
      if (
        rental.status === RentalStatus.APPROVED &&
        existing?.status !== RentalStatus.APPROVED
      ) {
        await tx.vehicleAvailabilityBlock.create({
          data: {
            vehicleId: rental.vehicleId,
            startDate: rental.startDate,
            endDate: rental.endDate,
            type: BlockType.BOOKED,
            reason: blockReason,
          },
        });
      }
      if (
        rental.status === RentalStatus.CANCELLED ||
        rental.status === RentalStatus.REJECTED
      ) {
        // Remove only this booking's reservation, never maintenance/manual blocks.
        await tx.vehicleAvailabilityBlock.deleteMany({
          where: {
            vehicleId: rental.vehicleId,
            type: BlockType.BOOKED,
            reason: blockReason,
          },
        });
      }
    });
  }
}
