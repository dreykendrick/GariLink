export const HASHING_SERVICE = 'HASHING_SERVICE';

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
