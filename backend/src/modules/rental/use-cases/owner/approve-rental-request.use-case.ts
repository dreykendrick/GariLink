import { Injectable, Inject } from "@nestjs/common";
import { IRentalRequestRepository } from "../../domain/repositories/rental-request.repository.interface";
import { PrismaService } from "../../../../shared/infrastructure/prisma.service";
import { Result } from "../../../../shared/domain/result";
import { AppError } from "../../../../core/errors/app-error";
import {
  RentalNotFoundError,
  RentalAccessDeniedError,
  InvalidRentalTransitionError,
} from "../../domain/errors/rental.errors";
import { canManageWorkspaceRentals } from "./owner-rental-access";

export interface ApproveRentalRequestCommand {
  userId: string;
  workspaceId: string;
  rentalId: string;
}

@Injectable()
export class ApproveRentalRequestUseCase {
  constructor(
    @Inject("IRentalRequestRepository") private repo: IRentalRequestRepository,
    private prisma: PrismaService,
  ) {}

  async execute(
    cmd: ApproveRentalRequestCommand,
  ): Promise<Result<void, AppError>> {
    const rental = await this.repo.findById(cmd.rentalId);
    if (!rental) return Result.fail(new RentalNotFoundError());

    if (
      rental.workspaceId !== cmd.workspaceId ||
      !(await canManageWorkspaceRentals(
        this.prisma,
        rental.workspaceId,
        cmd.userId,
      ))
    ) {
      return Result.fail(new RentalAccessDeniedError());
    }

    try {
      rental.approve();
    } catch (err) {
      return Result.fail(new InvalidRentalTransitionError());
    }

    await this.repo.save(rental);
    return Result.ok(undefined);
  }
}
