import { IRepository } from '../../../../shared/application/repository.interface';
import { Otp } from '../entities/otp.entity';
import { OtpPurpose } from '@prisma/client';
export declare const OTP_REPOSITORY = "OTP_REPOSITORY";
export interface IOtpRepository extends IRepository<Otp> {
    findLatestByPhoneAndPurpose(phoneNumber: string, purpose: OtpPurpose): Promise<Otp | null>;
    findLatestByUserAndPurpose(userId: string, purpose: OtpPurpose): Promise<Otp | null>;
    invalidateAllByPhoneAndPurpose(phoneNumber: string, purpose: OtpPurpose): Promise<void>;
}
