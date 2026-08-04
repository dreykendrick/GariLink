import { IEmailProvider } from '../../application/ports/email-provider.port';
export declare class ConsoleEmailProvider implements IEmailProvider {
    private readonly logger;
    constructor();
    sendVerificationEmail(to: string, code: string): Promise<void>;
    sendPasswordResetEmail(to: string, code: string): Promise<void>;
    sendWelcomeEmail(to: string, name: string): Promise<void>;
}
