import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from '../../../../core/errors/app-error';

// ─── User ─────────────────────────────────────────────────────────────────────

export class UserNotFoundError extends NotFoundError {
  override readonly code = 'USER_NOT_FOUND';
  constructor() { super('User not found'); }
}

export class EmailAlreadyExistsError extends ConflictError {
  override readonly code = 'EMAIL_EXISTS';
  constructor() { super('Email address is already in use'); }
}

export class PhoneAlreadyExistsError extends ConflictError {
  override readonly code = 'PHONE_EXISTS';
  constructor() { super('Phone number is already registered'); }
}

export class InvalidCredentialsError extends UnauthorizedError {
  override readonly code = 'INVALID_CREDENTIALS';
  constructor() { super('Invalid phone number or password'); }
}

export class AccountLockedError extends UnauthorizedError {
  override readonly code = 'ACCOUNT_LOCKED';
  constructor(lockedUntil: Date) {
    super(`Account is locked until ${lockedUntil.toISOString()}. Too many failed login attempts.`);
  }
}

export class AccountInactiveError extends UnauthorizedError {
  override readonly code = 'ACCOUNT_INACTIVE';
  constructor() { super('This account has been deactivated'); }
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

export class OtpInvalidError extends UnauthorizedError {
  override readonly code = 'OTP_INVALID';
  constructor() { super('Invalid OTP code'); }
}

export class OtpExpiredError extends UnauthorizedError {
  override readonly code = 'OTP_EXPIRED';
  constructor() { super('OTP has expired. Please request a new one.'); }
}

export class OtpMaxAttemptsExceededError extends UnauthorizedError {
  override readonly code = 'OTP_MAX_ATTEMPTS';
  constructor() { super('Maximum OTP verification attempts exceeded. Please request a new code.'); }
}

export class OtpResendCooldownError extends BadRequestError {
  override readonly code = 'OTP_COOLDOWN';
  constructor(remainingSeconds: number) {
    super(`Please wait ${remainingSeconds} seconds before requesting a new code`);
  }
}

// ─── Token / Session ──────────────────────────────────────────────────────────

export class RefreshTokenInvalidError extends UnauthorizedError {
  override readonly code = 'REFRESH_TOKEN_INVALID';
  constructor() { super('Invalid or expired refresh token'); }
}

export class RefreshTokenReuseDetectedError extends UnauthorizedError {
  override readonly code = 'REFRESH_TOKEN_REUSE';
  constructor() {
    super('Token reuse detected. All sessions revoked for your security. Please log in again.');
  }
}

export class SessionNotFoundError extends NotFoundError {
  override readonly code = 'SESSION_NOT_FOUND';
  constructor() { super('Session not found'); }
}

// ─── Capability ───────────────────────────────────────────────────────────────

export class CapabilityAlreadyRequestedError extends ConflictError {
  override readonly code = 'CAPABILITY_ALREADY_REQUESTED';
  constructor() { super('This capability has already been requested'); }
}

export class CapabilityNotFoundError extends NotFoundError {
  override readonly code = 'CAPABILITY_NOT_FOUND';
  constructor() { super('Capability not found'); }
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export class ProfileNotFoundError extends NotFoundError {
  override readonly code = 'PROFILE_NOT_FOUND';
  constructor() { super('User profile not found'); }
}
