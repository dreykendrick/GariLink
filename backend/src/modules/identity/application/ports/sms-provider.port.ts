import { OtpPurpose } from '@prisma/client';

export const SMS_PROVIDER = 'SMS_PROVIDER';

export interface ISmsProvider {
  sendOtp(phoneNumber: string, code: string, purpose: OtpPurpose): Promise<void>;
  sendWelcomeSms(phoneNumber: string, name: string): Promise<void>;
}
