import { ValueObject } from '../../../../shared/domain/value-object.base';
interface PasswordProps {
    value: string;
}
export declare class Password extends ValueObject<PasswordProps> {
    private static readonly MIN_LENGTH;
    private static readonly UPPERCASE;
    private static readonly LOWERCASE;
    private static readonly DIGIT;
    protected validate(): void;
    get value(): string;
    static create(password: string): Password;
}
export {};
