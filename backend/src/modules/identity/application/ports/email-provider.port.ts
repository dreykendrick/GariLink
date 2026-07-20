export const EMAIL_PROVIDER = 'EMAIL_PROVIDER';

export interface IEmailProvider {
  sendVerificationEmail(to: string, code: string): Promise<void>;
  sendPasswordResetEmail(to: string, code: string): Promise<void>;
  sendWelcomeEmail(to: string, name: string): Promise<void>;
}
