import { Inject, Injectable } from "@nestjs/common";
import { Currency, RentalStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

import {
  AppError,
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../../../core/errors/app-error";
import { PrismaService } from "../../../../shared/infrastructure/prisma.service";
import { Result } from "../../../../shared/domain/result";
import { RentalRequest } from "../../domain/entities/rental-request.entity";
import { IRentalRequestRepository } from "../../domain/repositories/rental-request.repository.interface";

export interface CreateRentalRequestCommand {
  customerId: string;
  listingId: string;
  startDate: Date;
  endDate: Date;
  pickupNotes?: string;
}

@Injectable()
export class CreateRentalRequestUseCase {
  constructor(
    @Inject("IRentalRequestRepository")
    private readonly rentals: IRentalRequestRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    command: CreateRentalRequestCommand,
  ): Promise<Result<RentalRequest, AppError>> {
    const { startDate, endDate } = command;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate < today ||
      endDate <= startDate
    ) {
      return Result.fail(
        new BadRequestError(
          "Choose valid future dates with return after pickup",
        ),
      );
    }

    const listing = await this.prisma.listing.findFirst({
      where: {
        id: command.listingId,
        status: "PUBLISHED",
        type: "FOR_HIRE",
        deletedAt: null,
      },
      include: { rentalConfig: true },
    });

    if (!listing?.rentalConfig) {
      return Result.fail(new NotFoundError("Rental listing not found"));
    }
    if (listing.listerId === command.customerId) {
      return Result.fail(
        new BadRequestError("You cannot rent your own vehicle"),
      );
    }

    const rentalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / 86_400_000,
    );
    const config = listing.rentalConfig;
    if (rentalDays < config.minimumRentalDays) {
      return Result.fail(
        new BadRequestError(
          `This vehicle requires at least ${config.minimumRentalDays} rental day(s)`,
        ),
      );
    }
    if (config.maximumRentalDays && rentalDays > config.maximumRentalDays) {
      return Result.fail(
        new BadRequestError(
          `This vehicle can be rented for at most ${config.maximumRentalDays} day(s)`,
        ),
      );
    }

    const conflict = await this.prisma.rentalRequest.findFirst({
      where: {
        vehicleId: listing.vehicleId,
        status: {
          in: [
            RentalStatus.REQUESTED,
            RentalStatus.UNDER_REVIEW,
            RentalStatus.APPROVED,
            RentalStatus.READY_FOR_PICKUP,
            RentalStatus.ACTIVE,
          ],
        },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
      select: { id: true },
    });
    const blocked = await this.prisma.vehicleAvailabilityBlock.findFirst({
      where: {
        vehicleId: listing.vehicleId,
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
      select: { id: true },
    });
    if (conflict || blocked) {
      return Result.fail(
        new ConflictError("This vehicle is unavailable for the selected dates"),
      );
    }

    const dailyRate = Number(config.dailyRate);
    const depositAmount = config.depositRequired
      ? Number(config.depositAmount ?? 0)
      : null;
    const totalAmount = dailyRate * rentalDays + (depositAmount ?? 0);
    const rental = RentalRequest.create(uuidv4(), {
      customerId: command.customerId,
      workspaceId: listing.workspaceId,
      vehicleId: listing.vehicleId,
      listingId: listing.id,
      status: RentalStatus.REQUESTED,
      startDate,
      endDate,
      dailyRate,
      currency: listing.currency as Currency,
      totalAmount,
      depositAmount,
      pickupNotes: command.pickupNotes?.trim() || null,
      rejectionReason: null,
    });

    await this.rentals.save(rental);
    return Result.ok(rental);
  }
}
