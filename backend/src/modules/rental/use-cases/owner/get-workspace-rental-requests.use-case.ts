import { Injectable, Inject } from '@nestjs/common';
import { IRentalRequestRepository } from '../../domain/repositories/rental-request.repository.interface';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { RentalRequest } from '../../domain/entities/rental-request.entity';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { RentalAccessDeniedError } from '../../domain/errors/rental.errors';

@Injectable()
export class GetWorkspaceRentalRequestsUseCase {
  constructor(
    @Inject('IRentalRequestRepository') private repo: IRentalRequestRepository,
    private prisma: PrismaService,
  ) {}

  async execute(userId: string, workspaceId: string): Promise<Result<RentalRequest[], AppError>> {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId }
    });
    if (!member) return Result.fail(new RentalAccessDeniedError());

    const rentals = await this.repo.findByWorkspaceId(workspaceId);
    return Result.ok(rentals);
  }
}
