export declare class RegisterUserDto {
    phoneNumber: string;
    password: string;
    firstName?: string;
    lastName?: string;
}
export declare class LoginDto {
    identifier: string;
    password: string;
    deviceId?: string;
    deviceName?: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class RequestOtpDto {
    phoneNumber: string;
    purpose: string;
}
export declare class VerifyOtpDto {
    phoneNumber: string;
    purpose: string;
    code: string;
}
export declare class ForgotPasswordDto {
    phoneNumber: string;
}
export declare class ResetPasswordDto {
    phoneNumber: string;
    otpCode: string;
    newPassword: string;
}
export declare class CompleteProfileDto {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    displayName?: string;
    dateOfBirth?: string;
    gender?: string;
    bio?: string;
    county?: string;
    city?: string;
    country?: string;
    timezone?: string;
    language?: string;
}
export declare class RequestCapabilityDto {
    type: string;
}
export declare class DecideCapabilityDto {
    decision: string;
    reason?: string;
}
