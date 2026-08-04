import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IRentalRequestRepository } from '../../domain/repositories/rental-request.repository.interface';
import { RentalRequest } from '../../domain/entities/rental-request.entity';
export declare class PrismaRentalRequestRepository implements IRentalRequestRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<RentalRequest | null>;
    findByCustomerId(customerId: string): Promise<RentalRequest[]>;
    findByWorkspaceId(workspaceId: string): Promise<RentalRequest[]>;
    save(rental: RentalRequest): Promise<void>;
}
