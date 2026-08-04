import { RentalRequest } from '../entities/rental-request.entity';
export interface IRentalRequestRepository {
    findById(id: string): Promise<RentalRequest | null>;
    findByCustomerId(customerId: string): Promise<RentalRequest[]>;
    findByWorkspaceId(workspaceId: string): Promise<RentalRequest[]>;
    save(rental: RentalRequest): Promise<void>;
}
