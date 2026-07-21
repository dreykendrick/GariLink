import { Injectable, Inject } from '@nestjs/common';
import { IRentalRequestRepository } from '../../domain/repositories/rental-request.repository.interface';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { RentalNotFoundError, RentalAccessDeniedError, InvalidRentalTransitionError } from '../../domain/errors/rental.errors';

export interface StartRentalCommand {
  userId: string;
  rentalId: string;
}

@Injectable()
export class StartRentalUseCase {
  constructor(
    @Inject('IRentalRequestRepository') private repo: IRentalRequestRepository,
    private prisma: PrismaService,
  ) {}

  async execute(cmd: StartRentalCommand): Promise<Result<void, AppError>> {
    const rental = await this.repo.findById(cmd.rentalId);
    if (!rental) return Result.fail(new RentalNotFoundError());

    const member = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId: rental.workspaceId, userId: cmd.userId }
    });
    if (!member) return Result.fail(new RentalAccessDeniedError());

    try {
      rental.start();
    } catch (err) {
      return Result.fail(new InvalidRentalTransitionError());
    }

    await this.repo.save(rental);
    return Result.ok(undefined);
  }
}
