import { OtpPurpose, CapabilityType, UserRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { IPasswordHasher } from '../../../../core/security/hashing.interface';
import { TokenService } from '../../../../core/security/token.service';
import { AuditLogService } from '../../../audit/audit-log.service';
import { User } from '../../domain/entities/user.entity';
import { Profile } from '../../domain/entities/profile.entity';
import { Session } from '../../domain/entities/session.entity';
import { UserCapability } from '../../domain/entities/user-capability.entity';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IProfileRepository } from '../../domain/repositories/profile.repository.interface';
import { ISessionRepository } from '../../domain/repositories/session.repository.interface';
import { IRefreshTokenRepository } from '../../domain/repositories/refresh-token.repository.interface';
import { IOtpRepository } from '../../domain/repositories/otp.repository.interface';
import { IUserCapabilityRepository } from '../../domain/repositories/user-capability.repository.interface';
import { ISmsProvider } from '../ports/sms-provider.port';
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        phoneNumber: string;
        email: string | null;
        roles: UserRole[];
        isPhoneVerified: boolean;
        isEmailVerified: boolean;
    };
    session: {
        id: string;
        deviceName: string | null;
    };
}
export declare class RegisterUserUseCase {
    private readonly users;
    private readonly profiles;
    private readonly sessions;
    private readonly refreshTokens;
    private readonly otps;
    private readonly hasher;
    private readonly sms;
    private readonly tokenService;
    private readonly configService;
    private readonly auditLog;
    constructor(users: IUserRepository, profiles: IProfileRepository, sessions: ISessionRepository, refreshTokens: IRefreshTokenRepository, otps: IOtpRepository, hasher: IPasswordHasher, sms: ISmsProvider, tokenService: TokenService, configService: ConfigService, auditLog: AuditLogService);
    execute(input: {
        phoneNumber: string;
        password: string;
        firstName?: string;
        lastName?: string;
        deviceId?: string;
        deviceName?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<Result<AuthResponse, AppError>>;
    private generateOtpCode;
    private parseExpiry;
}
export declare class AuthenticateUserUseCase {
    private readonly users;
    private readonly sessions;
    private readonly refreshTokens;
    private readonly hasher;
    private readonly tokenService;
    private readonly configService;
    private readonly auditLog;
    constructor(users: IUserRepository, sessions: ISessionRepository, refreshTokens: IRefreshTokenRepository, hasher: IPasswordHasher, tokenService: TokenService, configService: ConfigService, auditLog: AuditLogService);
    execute(input: {
        identifier: string;
        password: string;
        deviceId?: string;
        deviceName?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<Result<AuthResponse, AppError>>;
}
export declare class RefreshTokenUseCase {
    private readonly users;
    private readonly sessions;
    private readonly refreshTokens;
    private readonly hasher;
    private readonly tokenService;
    constructor(users: IUserRepository, sessions: ISessionRepository, refreshTokens: IRefreshTokenRepository, hasher: IPasswordHasher, tokenService: TokenService);
    execute(input: {
        refreshToken: string;
    }): Promise<Result<AuthResponse, AppError>>;
}
export declare class LogoutUseCase {
    private readonly sessions;
    private readonly refreshTokens;
    private readonly auditLog;
    constructor(sessions: ISessionRepository, refreshTokens: IRefreshTokenRepository, auditLog: AuditLogService);
    execute(input: {
        sessionId: string;
        userId: string;
    }): Promise<Result<void, AppError>>;
}
export declare class RequestOtpUseCase {
    private readonly users;
    private readonly otps;
    private readonly hasher;
    private readonly sms;
    private readonly configService;
    constructor(users: IUserRepository, otps: IOtpRepository, hasher: IPasswordHasher, sms: ISmsProvider, configService: ConfigService);
    execute(input: {
        phoneNumber: string;
        purpose: OtpPurpose;
    }): Promise<Result<{
        message: string;
    }, AppError>>;
}
export declare class VerifyOtpUseCase {
    private readonly users;
    private readonly otps;
    private readonly hasher;
    private readonly configService;
    constructor(users: IUserRepository, otps: IOtpRepository, hasher: IPasswordHasher, configService: ConfigService);
    execute(input: {
        phoneNumber: string;
        purpose: OtpPurpose;
        code: string;
    }): Promise<Result<{
        verified: boolean;
    }, AppError>>;
}
export declare class ForgotPasswordUseCase {
    private readonly users;
    private readonly otps;
    private readonly hasher;
    private readonly sms;
    private readonly configService;
    constructor(users: IUserRepository, otps: IOtpRepository, hasher: IPasswordHasher, sms: ISmsProvider, configService: ConfigService);
    execute(input: {
        phoneNumber: string;
    }): Promise<Result<{
        message: string;
    }, AppError>>;
}
export declare class ResetPasswordUseCase {
    private readonly users;
    private readonly sessions;
    private readonly refreshTokens;
    private readonly otps;
    private readonly hasher;
    private readonly configService;
    private readonly auditLog;
    constructor(users: IUserRepository, sessions: ISessionRepository, refreshTokens: IRefreshTokenRepository, otps: IOtpRepository, hasher: IPasswordHasher, configService: ConfigService, auditLog: AuditLogService);
    execute(input: {
        phoneNumber: string;
        otpCode: string;
        newPassword: string;
    }): Promise<Result<{
        message: string;
    }, AppError>>;
}
export declare class GetCurrentUserUseCase {
    private readonly users;
    private readonly profiles;
    private readonly capabilities;
    constructor(users: IUserRepository, profiles: IProfileRepository, capabilities: IUserCapabilityRepository);
    execute(input: {
        userId: string;
    }): Promise<Result<{
        user: User;
        profile: Profile | null;
        capabilities: UserCapability[];
    }, AppError>>;
}
export declare class CompleteProfileUseCase {
    private readonly users;
    private readonly profiles;
    constructor(users: IUserRepository, profiles: IProfileRepository);
    execute(input: {
        userId: string;
        fields: Record<string, unknown>;
    }): Promise<Result<Profile, AppError>>;
}
export declare class RequestCapabilityUseCase {
    private readonly capabilities;
    private readonly auditLog;
    constructor(capabilities: IUserCapabilityRepository, auditLog: AuditLogService);
    private readonly AUTO_APPROVE_TYPES;
    execute(input: {
        userId: string;
        type: CapabilityType;
    }): Promise<Result<UserCapability, AppError>>;
}
export declare class DecideCapabilityUseCase {
    private readonly capabilities;
    private readonly auditLog;
    constructor(capabilities: IUserCapabilityRepository, auditLog: AuditLogService);
    execute(input: {
        capabilityId: string;
        decision: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'revoke';
        adminId: string;
        reason?: string;
    }): Promise<Result<UserCapability, AppError>>;
}
export declare class ListSessionsUseCase {
    private readonly sessions;
    constructor(sessions: ISessionRepository);
    execute(input: {
        userId: string;
        currentSessionId: string;
    }): Promise<Result<Array<Session & {
        isCurrent: boolean;
    }>, AppError>>;
}
export declare class RevokeSessionUseCase {
    private readonly sessions;
    private readonly refreshTokens;
    private readonly auditLog;
    constructor(sessions: ISessionRepository, refreshTokens: IRefreshTokenRepository, auditLog: AuditLogService);
    execute(input: {
        sessionId: string;
        userId: string;
    }): Promise<Result<void, AppError>>;
}
