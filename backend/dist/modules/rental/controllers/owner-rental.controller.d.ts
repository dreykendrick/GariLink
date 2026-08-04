import { GetWorkspaceRentalRequestsUseCase } from '../use-cases/owner/get-workspace-rental-requests.use-case';
import { ApproveRentalRequestUseCase } from '../use-cases/owner/approve-rental-request.use-case';
import { RejectRentalRequestUseCase } from '../use-cases/owner/reject-rental-request.use-case';
import { MarkRentalReadyUseCase } from '../use-cases/owner/mark-rental-ready.use-case';
import { StartRentalUseCase } from '../use-cases/owner/start-rental.use-case';
import { CompleteRentalUseCase } from '../use-cases/owner/complete-rental.use-case';
export declare class OwnerRentalController {
    private readonly getWorkspaceRentalRequests;
    private readonly approveRentalRequest;
    private readonly rejectRentalRequest;
    private readonly markRentalReady;
    private readonly startRental;
    private readonly completeRental;
    constructor(getWorkspaceRentalRequests: GetWorkspaceRentalRequestsUseCase, approveRentalRequest: ApproveRentalRequestUseCase, rejectRentalRequest: RejectRentalRequestUseCase, markRentalReady: MarkRentalReadyUseCase, startRental: StartRentalUseCase, completeRental: CompleteRentalUseCase);
    getRequests(user: any, workspaceId: string): Promise<import("../domain/entities/rental-request.entity").RentalRequest[]>;
    approve(user: any, rentalId: string): Promise<{
        success: boolean;
    }>;
    reject(user: any, rentalId: string, body: any): Promise<{
        success: boolean;
    }>;
    ready(user: any, rentalId: string): Promise<{
        success: boolean;
    }>;
    start(user: any, rentalId: string): Promise<{
        success: boolean;
    }>;
    complete(user: any, rentalId: string): Promise<{
        success: boolean;
    }>;
}
