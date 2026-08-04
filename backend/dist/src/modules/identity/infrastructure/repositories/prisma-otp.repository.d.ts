import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IOtpRepository } from '../../domain/repositories/otp.repository.interface';
import { Otp } from '../../domain/entities/otp.entity';
import { OtpPurpose } from '@prisma/client';
export declare class PrismaOtpRepository implements IOtpRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toDomain;
    findById(id: string): Promise<Otp | null>;
    findLatestByPhoneAndPurpose(phoneNumber: string, purpose: OtpPurpose): Promise<Otp | null>;
    findLatestByUserAndPurpose(userId: string, purpose: OtpPurpose): Promise<Otp | null>;
    save(otp: Otp): Promise<void>;
    delete(id: string): Promise<void>;
    invalidateAllByPhoneAndPurpose(phoneNumber: string, purpose: OtpPurpose): Promise<void>;
}
