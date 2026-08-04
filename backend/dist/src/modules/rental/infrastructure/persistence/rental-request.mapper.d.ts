import { RentalRequest as PrismaRentalRequest } from '@prisma/client';
import { RentalRequest } from '../../domain/entities/rental-request.entity';
export declare class RentalRequestMapper {
    static toDomain(raw: PrismaRentalRequest): RentalRequest;
    static toPersistence(domain: RentalRequest): any;
}
