import { IPasswordHasher } from './hashing.interface';
export declare class BcryptPasswordHasher implements IPasswordHasher {
    private readonly saltRounds;
    hash(password: string): Promise<string>;
    compare(plain: string, hash: string): Promise<boolean>;
}
