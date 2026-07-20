import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider } from '../../application/ports/email-provider.port';

@Injectable()
export class ConsoleEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  constructor() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'ConsoleEmailProvider cannot be used in production. Configure a real email provider.',
      );
    }
  }

  async sendVerificationEmail(to: string, code: string): Promise<void> {
    this.logger.log(`[DEV EMAIL] Verification code for ${to}: ${code}`);
  }

  async sendPasswordResetEmail(to: string, code: string): Promise<void> {
    this.logger.log(`[DEV EMAIL] Password reset code for ${to}: ${code}`);
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    this.logger.log(`[DEV EMAIL] Welcome email sent to ${to} (${name})`);
  }
}
