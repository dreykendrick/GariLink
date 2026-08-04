import { ValueObject } from '../../../../shared/domain/value-object.base';
interface PhoneProps {
    value: string;
}
export declare class PhoneNumber extends ValueObject<PhoneProps> {
    private static readonly E164_REGEX;
    protected validate(): void;
    get value(): string;
    static create(phone: string): PhoneNumber;
}
export {};
