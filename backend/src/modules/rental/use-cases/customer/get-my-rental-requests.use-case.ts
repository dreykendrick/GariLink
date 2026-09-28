import { Injectable } from "@nestjs/common";
import { Result } from "../../../../shared/domain/result";
import { AppError } from "../../../../core/errors/app-error";
import { PrismaService } from "../../../../shared/infrastructure/prisma.service";
import {
  RentalRequestSummary,
  rentalSummarySelect,
  toRentalRequestSummary,
} from "../rental-request-summary";

@Injectable()
export class GetMyRentalRequestsUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(
    customerId: string,
  ): Promise<Result<RentalRequestSummary[], AppError>> {
    const rentals = await this.prisma.rentalRequest.findMany({
      where: { customerId },
      select: rentalSummarySelect,
      orderBy: { createdAt: "desc" },
    });
    return Result.ok(rentals.map(toRentalRequestSummary));
  }
}
