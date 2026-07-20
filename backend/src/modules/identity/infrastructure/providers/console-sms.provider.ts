import { Injectable, Logger } from '@nestjs/common';
import { ISmsProvider } from '../../application/ports/sms-provider.port';
import { OtpPurpose } from '@prisma/client';

@Injectable()
export class ConsoleSmsProvider implements ISmsProvider {
  private readonly logger = new Logger(ConsoleSmsProvider.name);

  constructor() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'ConsoleSmsProvider cannot be used in production. Configure a real SMS provider.',
      );
    }
  }

  async sendOtp(
    phoneNumber: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    this.logger.log(
      `[DEV SMS] OTP to ${phoneNumber} for ${purpose}: ${code}`,
    );
  }

  async sendWelcomeSms(phoneNumber: string, name: string): Promise<void> {
    this.logger.log(
      `[DEV SMS] Welcome to GariLink, ${name}! Sent to ${phoneNumber}`,
    );
  }
}
