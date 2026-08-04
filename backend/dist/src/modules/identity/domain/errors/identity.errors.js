"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileNotFoundError = exports.CapabilityNotFoundError = exports.CapabilityAlreadyRequestedError = exports.SessionNotFoundError = exports.RefreshTokenReuseDetectedError = exports.RefreshTokenInvalidError = exports.OtpResendCooldownError = exports.OtpMaxAttemptsExceededError = exports.OtpExpiredError = exports.OtpInvalidError = exports.AccountInactiveError = exports.AccountLockedError = exports.InvalidCredentialsError = exports.PhoneAlreadyExistsError = exports.EmailAlreadyExistsError = exports.UserNotFoundError = void 0;
const app_error_1 = require("../../../../core/errors/app-error");
class UserNotFoundError extends app_error_1.NotFoundError {
    constructor() {
        super('User not found');
        this.code = 'USER_NOT_FOUND';
    }
}
exports.UserNotFoundError = UserNotFoundError;
class EmailAlreadyExistsError extends app_error_1.ConflictError {
    constructor() {
        super('Email address is already in use');
        this.code = 'EMAIL_EXISTS';
    }
}
exports.EmailAlreadyExistsError = EmailAlreadyExistsError;
class PhoneAlreadyExistsError extends app_error_1.ConflictError {
    constructor() {
        super('Phone number is already registered');
        this.code = 'PHONE_EXISTS';
    }
}
exports.PhoneAlreadyExistsError = PhoneAlreadyExistsError;
class InvalidCredentialsError extends app_error_1.UnauthorizedError {
    constructor() {
        super('Invalid phone number or password');
        this.code = 'INVALID_CREDENTIALS';
    }
}
exports.InvalidCredentialsError = InvalidCredentialsError;
class AccountLockedError extends app_error_1.UnauthorizedError {
    constructor(lockedUntil) {
        super(`Account is locked until ${lockedUntil.toISOString()}. Too many failed login attempts.`);
        this.code = 'ACCOUNT_LOCKED';
    }
}
exports.AccountLockedError = AccountLockedError;
class AccountInactiveError extends app_error_1.UnauthorizedError {
    constructor() {
        super('This account has been deactivated');
        this.code = 'ACCOUNT_INACTIVE';
    }
}
exports.AccountInactiveError = AccountInactiveError;
class OtpInvalidError extends app_error_1.UnauthorizedError {
    constructor() {
        super('Invalid OTP code');
        this.code = 'OTP_INVALID';
    }
}
exports.OtpInvalidError = OtpInvalidError;
class OtpExpiredError extends app_error_1.UnauthorizedError {
    constructor() {
        super('OTP has expired. Please request a new one.');
        this.code = 'OTP_EXPIRED';
    }
}
exports.OtpExpiredError = OtpExpiredError;
class OtpMaxAttemptsExceededError extends app_error_1.UnauthorizedError {
    constructor() {
        super('Maximum OTP verification attempts exceeded. Please request a new code.');
        this.code = 'OTP_MAX_ATTEMPTS';
    }
}
exports.OtpMaxAttemptsExceededError = OtpMaxAttemptsExceededError;
class OtpResendCooldownError extends app_error_1.BadRequestError {
    constructor(remainingSeconds) {
        super(`Please wait ${remainingSeconds} seconds before requesting a new code`);
        this.code = 'OTP_COOLDOWN';
    }
}
exports.OtpResendCooldownError = OtpResendCooldownError;
class RefreshTokenInvalidError extends app_error_1.UnauthorizedError {
    constructor() {
        super('Invalid or expired refresh token');
        this.code = 'REFRESH_TOKEN_INVALID';
    }
}
exports.RefreshTokenInvalidError = RefreshTokenInvalidError;
class RefreshTokenReuseDetectedError extends app_error_1.UnauthorizedError {
    constructor() {
        super('Token reuse detected. All sessions revoked for your security. Please log in again.');
        this.code = 'REFRESH_TOKEN_REUSE';
    }
}
exports.RefreshTokenReuseDetectedError = RefreshTokenReuseDetectedError;
class SessionNotFoundError extends app_error_1.NotFoundError {
    constructor() {
        super('Session not found');
        this.code = 'SESSION_NOT_FOUND';
    }
}
exports.SessionNotFoundError = SessionNotFoundError;
class CapabilityAlreadyRequestedError extends app_error_1.ConflictError {
    constructor() {
        super('This capability has already been requested');
        this.code = 'CAPABILITY_ALREADY_REQUESTED';
    }
}
exports.CapabilityAlreadyRequestedError = CapabilityAlreadyRequestedError;
class CapabilityNotFoundError extends app_error_1.NotFoundError {
    constructor() {
        super('Capability not found');
        this.code = 'CAPABILITY_NOT_FOUND';
    }
}
exports.CapabilityNotFoundError = CapabilityNotFoundError;
class ProfileNotFoundError extends app_error_1.NotFoundError {
    constructor() {
        super('User profile not found');
        this.code = 'PROFILE_NOT_FOUND';
    }
}
exports.ProfileNotFoundError = ProfileNotFoundError;
//# sourceMappingURL=identity.errors.js.map