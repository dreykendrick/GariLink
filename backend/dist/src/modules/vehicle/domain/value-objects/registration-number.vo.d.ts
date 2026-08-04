import { ValueObject } from '../../../../shared/domain/value-object.base';
export interface RegistrationNumberProps {
    value: string;
}
export declare class RegistrationNumber extends ValueObject<RegistrationNumberProps> {
    protected validate(): void;
    get value(): string;
}
