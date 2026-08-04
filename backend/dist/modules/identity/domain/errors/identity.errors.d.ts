import { BadRequestError, UnauthorizedError, NotFoundError, ConflictError } from '../../../../core/errors/app-error';
export declare class UserNotFoundError extends NotFoundError {
    readonly code = "USER_NOT_FOUND";
    constructor();
}
export declare class EmailAlreadyExistsError extends ConflictError {
    readonly code = "EMAIL_EXISTS";
    constructor();
}
export declare class PhoneAlreadyExistsError extends ConflictError {
    readonly code = "PHONE_EXISTS";
    constructor();
}
export declare class InvalidCredentialsError extends UnauthorizedError {
    readonly code = "INVALID_CREDENTIALS";
    constructor();
}
export declare class AccountLockedError extends UnauthorizedError {
    readonly code = "ACCOUNT_LOCKED";
    constructor(lockedUntil: Date);
}
export declare class AccountInactiveError extends UnauthorizedError {
    readonly code = "ACCOUNT_INACTIVE";
    constructor();
}
export declare class OtpInvalidError extends UnauthorizedError {
    readonly code = "OTP_INVALID";
    constructor();
}
export declare class OtpExpiredError extends UnauthorizedError {
    readonly code = "OTP_EXPIRED";
    constructor();
}
export declare class OtpMaxAttemptsExceededError extends UnauthorizedError {
    readonly code = "OTP_MAX_ATTEMPTS";
    constructor();
}
export declare class OtpResendCooldownError extends BadRequestError {
    readonly code = "OTP_COOLDOWN";
    constructor(remainingSeconds: number);
}
export declare class RefreshTokenInvalidError extends UnauthorizedError {
    readonly code = "REFRESH_TOKEN_INVALID";
    constructor();
}
export declare class RefreshTokenReuseDetectedError extends UnauthorizedError {
    readonly code = "REFRESH_TOKEN_REUSE";
    constructor();
}
export declare class SessionNotFoundError extends NotFoundError {
    readonly code = "SESSION_NOT_FOUND";
    constructor();
}
export declare class CapabilityAlreadyRequestedError extends ConflictError {
    readonly code = "CAPABILITY_ALREADY_REQUESTED";
    constructor();
}
export declare class CapabilityNotFoundError extends NotFoundError {
    readonly code = "CAPABILITY_NOT_FOUND";
    constructor();
}
export declare class ProfileNotFoundError extends NotFoundError {
    readonly code = "PROFILE_NOT_FOUND";
    constructor();
}
