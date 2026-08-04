import { ValueObject } from '../../../../shared/domain/value-object.base';
interface EmailProps {
    value: string;
}
export declare class Email extends ValueObject<EmailProps> {
    private static readonly EMAIL_REGEX;
    protected validate(): void;
    get value(): string;
    static create(email: string): Email;
}
export {};
