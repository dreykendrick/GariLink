import { Request } from 'express';
import { AccessJwtPayload } from '../../../../core/security/token.service';
import { RegisterUserDto, LoginDto, RefreshTokenDto, RequestOtpDto, VerifyOtpDto, ForgotPasswordDto, ResetPasswordDto, CompleteProfileDto, RequestCapabilityDto, DecideCapabilityDto } from '../../application/dto/identity.dto';
import { RegisterUserUseCase, AuthenticateUserUseCase, RefreshTokenUseCase, LogoutUseCase, RequestOtpUseCase, VerifyOtpUseCase, ForgotPasswordUseCase, ResetPasswordUseCase, GetCurrentUserUseCase, CompleteProfileUseCase, RequestCapabilityUseCase, DecideCapabilityUseCase, ListSessionsUseCase, RevokeSessionUseCase } from '../../application/use-cases/identity.use-cases';
export declare class AuthController {
    private readonly register;
    private readonly login;
    private readonly refresh;
    private readonly logout;
    private readonly requestOtp;
    private readonly verifyOtp;
    private readonly forgotPassword;
    private readonly resetPassword;
    constructor(register: RegisterUserUseCase, login: AuthenticateUserUseCase, refresh: RefreshTokenUseCase, logout: LogoutUseCase, requestOtp: RequestOtpUseCase, verifyOtp: VerifyOtpUseCase, forgotPassword: ForgotPasswordUseCase, resetPassword: ResetPasswordUseCase);
    registerUser(dto: RegisterUserDto, req: Request): Promise<import("../../application/use-cases/identity.use-cases").AuthResponse>;
    loginUser(dto: LoginDto, req: Request): Promise<import("../../application/use-cases/identity.use-cases").AuthResponse>;
    refreshToken(dto: RefreshTokenDto): Promise<import("../../application/use-cases/identity.use-cases").AuthResponse>;
    logoutUser(user: AccessJwtPayload): Promise<void>;
    otpRequest(dto: RequestOtpDto): Promise<{
        message: string;
    }>;
    otpResend(dto: RequestOtpDto): Promise<{
        message: string;
    }>;
    otpVerify(dto: VerifyOtpDto): Promise<{
        verified: boolean;
    }>;
    forgotPass(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPass(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
export declare class ProfileController {
    private readonly getCurrentUser;
    private readonly completeProfile;
    constructor(getCurrentUser: GetCurrentUserUseCase, completeProfile: CompleteProfileUseCase);
    getMe(user: AccessJwtPayload): Promise<{
        id: string;
        phoneNumber: string;
        email: string | null;
        roles: import(".prisma/client").$Enums.UserRole[];
        isPhoneVerified: boolean;
        isEmailVerified: boolean;
        profile: import("../../domain/entities/profile.entity").Profile | null;
        capabilities: import("../../domain/entities/user-capability.entity").UserCapability[];
    }>;
    updateProfile(user: AccessJwtPayload, dto: CompleteProfileDto): Promise<import("../../domain/entities/profile.entity").Profile>;
}
export declare class SessionController {
    private readonly listSessions;
    private readonly revokeSession;
    constructor(listSessions: ListSessionsUseCase, revokeSession: RevokeSessionUseCase);
    list(user: AccessJwtPayload): Promise<(import("../../domain/entities/session.entity").Session & {
        isCurrent: boolean;
    })[]>;
    revoke(id: string, user: AccessJwtPayload): Promise<void>;
}
export declare class CapabilityController {
    private readonly requestCap;
    private readonly decideCap;
    constructor(requestCap: RequestCapabilityUseCase, decideCap: DecideCapabilityUseCase);
    requestCapability(user: AccessJwtPayload, dto: RequestCapabilityDto): Promise<import("../../domain/entities/user-capability.entity").UserCapability>;
    decideCapability(id: string, dto: DecideCapabilityDto, admin: AccessJwtPayload): Promise<import("../../domain/entities/user-capability.entity").UserCapability>;
}
