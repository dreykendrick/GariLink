import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { UserRole } from '@prisma/client';
import { Email } from '../value-objects/email.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';

export interface UserProps {
  email: Email | null;
  phoneNumber: PhoneNumber;
  passwordHash: string;
  roles: UserRole[];
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}

export class User extends AggregateRoot<string> {
  private _email: Email | null;
  private _phoneNumber: PhoneNumber;
  private _passwordHash: string;
  private _roles: UserRole[];
  private _isEmailVerified: boolean;
  private _isPhoneVerified: boolean;
  private _isActive: boolean;
  private _lastLoginAt: Date | null;
  private _failedLoginAttempts: number;
  private _lockedUntil: Date | null;

  constructor(
    id: string,
    props: UserProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._email = props.email;
    this._phoneNumber = props.phoneNumber;
    this._passwordHash = props.passwordHash;
    this._roles = [...props.roles];
    this._isEmailVerified = props.isEmailVerified;
    this._isPhoneVerified = props.isPhoneVerified;
    this._isActive = props.isActive;
    this._lastLoginAt = props.lastLoginAt;
    this._failedLoginAttempts = props.failedLoginAttempts;
    this._lockedUntil = props.lockedUntil;
  }

  // ─── Getters ─────────────────────────────────────────────────────────

  get email(): Email | null { return this._email; }
  get phoneNumber(): PhoneNumber { return this._phoneNumber; }
  get passwordHash(): string { return this._passwordHash; }
  get roles(): UserRole[] { return [...this._roles]; }
  get isEmailVerified(): boolean { return this._isEmailVerified; }
  get isPhoneVerified(): boolean { return this._isPhoneVerified; }
  get isActive(): boolean { return this._isActive; }
  get lastLoginAt(): Date | null { return this._lastLoginAt; }
  get failedLoginAttempts(): number { return this._failedLoginAttempts; }
  get lockedUntil(): Date | null { return this._lockedUntil; }

  // ─── Factory ─────────────────────────────────────────────────────────

  static create(
    props: UserProps,
    id?: string,
  ): User {
    const { v4: uuidv4 } = require('uuid') as { v4: () => string };
    return new User(id ?? uuidv4(), props);
  }

  // ─── Domain methods ───────────────────────────────────────────────────

  verifyPhone(): void {
    this._isPhoneVerified = true;
    this.touch();
  }

  verifyEmail(): void {
    this._isEmailVerified = true;
    this.touch();
  }

  updateEmail(email: Email): void {
    this._email = email;
    this._isEmailVerified = false;
    this.touch();
  }

  recordFailedLogin(): void {
    this._failedLoginAttempts += 1;
    this.touch();
  }

  lock(until: Date): void {
    this._lockedUntil = until;
    this.touch();
  }

  unlock(): void {
    this._lockedUntil = null;
    this._failedLoginAttempts = 0;
    this.touch();
  }

  isLocked(): boolean {
    if (!this._lockedUntil) return false;
    return this._lockedUntil > new Date();
  }

  updateLastLogin(): void {
    this._lastLoginAt = new Date();
    this._failedLoginAttempts = 0;
    this._lockedUntil = null;
    this.touch();
  }

  deactivate(): void {
    this._isActive = false;
    this.touch();
  }

  activate(): void {
    this._isActive = true;
    this.touch();
  }

  hasRole(role: UserRole): boolean {
    return this._roles.includes(role);
  }

  addRole(role: UserRole): void {
    if (!this._roles.includes(role)) {
      this._roles.push(role);
      this.touch();
    }
  }

  removeRole(role: UserRole): void {
    this._roles = this._roles.filter((r) => r !== role);
    this.touch();
  }
}
