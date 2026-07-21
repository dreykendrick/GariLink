import { Module } from '@nestjs/common';
import { PrismaRentalRequestRepository } from './infrastructure/persistence/prisma-rental-request.repository';
import { CreateRentalRequestUseCase } from './use-cases/customer/create-rental-request.use-case';
import { CancelRentalRequestUseCase } from './use-cases/customer/cancel-rental-request.use-case';
import { GetMyRentalRequestsUseCase } from './use-cases/customer/get-my-rental-requests.use-case';
import { GetWorkspaceRentalRequestsUseCase } from './use-cases/owner/get-workspace-rental-requests.use-case';
import { ApproveRentalRequestUseCase } from './use-cases/owner/approve-rental-request.use-case';
import { RejectRentalRequestUseCase } from './use-cases/owner/reject-rental-request.use-case';
import { MarkRentalReadyUseCase } from './use-cases/owner/mark-rental-ready.use-case';
import { StartRentalUseCase } from './use-cases/owner/start-rental.use-case';
import { CompleteRentalUseCase } from './use-cases/owner/complete-rental.use-case';
import { CustomerRentalController } from './controllers/customer-rental.controller';
import { OwnerRentalController } from './controllers/owner-rental.controller';
import { PrismaService } from '../../shared/infrastructure/prisma.service';

const useCases = [
  CreateRentalRequestUseCase,
  CancelRentalRequestUseCase,
  GetMyRentalRequestsUseCase,
  GetWorkspaceRentalRequestsUseCase,
  ApproveRentalRequestUseCase,
  RejectRentalRequestUseCase,
  MarkRentalReadyUseCase,
  StartRentalUseCase,
  CompleteRentalUseCase,
];

@Module({
  controllers: [CustomerRentalController, OwnerRentalController],
  providers: [
    PrismaService,
    {
      provide: 'IRentalRequestRepository',
      useClass: PrismaRentalRequestRepository,
    },
    ...useCases,
  ],
  exports: [
    'IRentalRequestRepository',
    ...useCases,
  ],
})
export class RentalModule {}