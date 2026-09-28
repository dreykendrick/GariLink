import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../shared/infrastructure/prisma.service";
import {
  RentalRequestSummary,
  rentalSummarySelect,
  toRentalRequestSummary,
} from "../rental-request-summary";
import { Result } from "../../../../shared/domain/result";
import { AppError } from "../../../../core/errors/app-error";
import { RentalAccessDeniedError } from "../../domain/errors/rental.errors";
import { canManageWorkspaceRentals } from "./owner-rental-access";

@Injectable()
export class GetWorkspaceRentalRequestsUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(
    userId: string,
    workspaceId: string,
  ): Promise<Result<RentalRequestSummary[], AppError>> {
    if (!(await canManageWorkspaceRentals(this.prisma, workspaceId, userId))) {
      return Result.fail(new RentalAccessDeniedError());
    }

    const rentals = await this.prisma.rentalRequest.findMany({
      where: { workspaceId },
      select: rentalSummarySelect,
      orderBy: { createdAt: "desc" },
    });
    return Result.ok(rentals.map(toRentalRequestSummary));
  }
}
