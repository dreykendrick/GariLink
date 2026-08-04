import { ISmsProvider } from '../../application/ports/sms-provider.port';
import { OtpPurpose } from '@prisma/client';
export declare class ConsoleSmsProvider implements ISmsProvider {
    private readonly logger;
    constructor();
    sendOtp(phoneNumber: string, code: string, purpose: OtpPurpose): Promise<void>;
    sendWelcomeSms(phoneNumber: string, name: string): Promise<void>;
}
