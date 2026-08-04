import { CreateRentalRequestUseCase } from '../use-cases/customer/create-rental-request.use-case';
import { CancelRentalRequestUseCase } from '../use-cases/customer/cancel-rental-request.use-case';
import { GetMyRentalRequestsUseCase } from '../use-cases/customer/get-my-rental-requests.use-case';
export declare class CustomerRentalController {
    private readonly createRentalRequest;
    private readonly cancelRentalRequest;
    private readonly getMyRentalRequests;
    constructor(createRentalRequest: CreateRentalRequestUseCase, cancelRentalRequest: CancelRentalRequestUseCase, getMyRentalRequests: GetMyRentalRequestsUseCase);
    create(user: any, body: any): Promise<{
        id: string;
    }>;
    cancel(user: any, rentalId: string): Promise<{
        success: boolean;
    }>;
    getMy(user: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.RentalStatus;
        startDate: Date;
        endDate: Date;
    }[]>;
}
