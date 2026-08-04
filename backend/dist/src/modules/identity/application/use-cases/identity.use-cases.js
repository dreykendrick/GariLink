"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevokeSessionUseCase = exports.ListSessionsUseCase = exports.DecideCapabilityUseCase = exports.RequestCapabilityUseCase = exports.CompleteProfileUseCase = exports.GetCurrentUserUseCase = exports.ResetPasswordUseCase = exports.ForgotPasswordUseCase = exports.VerifyOtpUseCase = exports.RequestOtpUseCase = exports.LogoutUseCase = exports.RefreshTokenUseCase = exports.AuthenticateUserUseCase = exports.RegisterUserUseCase = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const config_1 = require("@nestjs/config");
const result_1 = require("../../../../shared/domain/result");
const app_error_1 = require("../../../../core/errors/app-error");
const hashing_interface_1 = require("../../../../core/security/hashing.interface");
const token_service_1 = require("../../../../core/security/token.service");
const audit_log_service_1 = require("../../../audit/audit-log.service");
const user_entity_1 = require("../../domain/entities/user.entity");
const profile_entity_1 = require("../../domain/entities/profile.entity");
const session_entity_1 = require("../../domain/entities/session.entity");
const refresh_token_entity_1 = require("../../domain/entities/refresh-token.entity");
const otp_entity_1 = require("../../domain/entities/otp.entity");
const user_capability_entity_1 = require("../../domain/entities/user-capability.entity");
const phone_number_vo_1 = require("../../domain/value-objects/phone-number.vo");
const password_vo_1 = require("../../domain/value-objects/password.vo");
const user_repository_interface_1 = require("../../domain/repositories/user.repository.interface");
const profile_repository_interface_1 = require("../../domain/repositories/profile.repository.interface");
const session_repository_interface_1 = require("../../domain/repositories/session.repository.interface");
const refresh_token_repository_interface_1 = require("../../domain/repositories/refresh-token.repository.interface");
const otp_repository_interface_1 = require("../../domain/repositories/otp.repository.interface");
const user_capability_repository_interface_1 = require("../../domain/repositories/user-capability.repository.interface");
const sms_provider_port_1 = require("../ports/sms-provider.port");
const identity_errors_1 = require("../../domain/errors/identity.errors");
let RegisterUserUseCase = class RegisterUserUseCase {
    constructor(users, profiles, sessions, refreshTokens, otps, hasher, sms, tokenService, configService, auditLog) {
        this.users = users;
        this.profiles = profiles;
        this.sessions = sessions;
        this.refreshTokens = refreshTokens;
        this.otps = otps;
        this.hasher = hasher;
        this.sms = sms;
        this.tokenService = tokenService;
        this.configService = configService;
        this.auditLog = auditLog;
    }
    async execute(input) {
        try {
            const phoneVO = phone_number_vo_1.PhoneNumber.create(input.phoneNumber);
            password_vo_1.Password.create(input.password);
            const existing = await this.users.findByPhoneNumber(phoneVO.value);
            if (existing)
                return result_1.Result.fail(new identity_errors_1.PhoneAlreadyExistsError());
            const passwordHash = await this.hasher.hash(input.password);
            const userId = (0, uuid_1.v4)();
            const user = user_entity_1.User.create({
                email: null,
                phoneNumber: phoneVO,
                passwordHash,
                roles: [client_1.UserRole.CUSTOMER],
                isEmailVerified: false,
                isPhoneVerified: false,
                isActive: true,
                lastLoginAt: null,
                failedLoginAttempts: 0,
                lockedUntil: null,
            }, userId);
            await this.users.save(user);
            const profile = profile_entity_1.Profile.create((0, uuid_1.v4)(), userId);
            if (input.firstName)
                profile.firstName = input.firstName;
            if (input.lastName)
                profile.lastName = input.lastName;
            await this.profiles.save(profile);
            const session = session_entity_1.Session.create({
                id: (0, uuid_1.v4)(),
                userId,
                deviceId: input.deviceId,
                deviceName: input.deviceName,
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
            });
            await this.sessions.save(session);
            const familyId = (0, uuid_1.v4)();
            const accessToken = this.tokenService.generateAccessToken({
                userId,
                roles: user.roles,
                sessionId: session.id,
            });
            const rawRefreshToken = this.tokenService.generateRefreshToken({
                userId,
                sessionId: session.id,
                familyId,
            });
            const refreshTokenHash = await this.hasher.hash(rawRefreshToken);
            const expiryMs = this.parseExpiry(this.configService.get('app.jwt.refreshExpiresIn') ?? '30d');
            const refreshToken = refresh_token_entity_1.RefreshToken.create({
                id: (0, uuid_1.v4)(),
                token: refreshTokenHash,
                userId,
                sessionId: session.id,
                familyId,
                expiresAt: new Date(Date.now() + expiryMs),
            });
            await this.refreshTokens.save(refreshToken);
            const otpCode = this.generateOtpCode(this.configService.get('app.otp.length') ?? 6);
            const otpHash = await this.hasher.hash(otpCode);
            const otp = otp_entity_1.Otp.generate((0, uuid_1.v4)(), phoneVO.value, userId, client_1.OtpPurpose.PHONE_VERIFICATION, otpHash, this.configService.get('app.otp.expiryMinutes') ?? 10);
            await this.otps.save(otp);
            await this.sms.sendOtp(phoneVO.value, otpCode, client_1.OtpPurpose.PHONE_VERIFICATION);
            await this.auditLog.log({
                action: 'user.registered',
                actorId: userId,
                subjectType: 'User',
                subjectId: userId,
                ipAddress: input.ipAddress,
            });
            return result_1.Result.ok({
                accessToken,
                refreshToken: rawRefreshToken,
                user: {
                    id: userId,
                    phoneNumber: user.phoneNumber.value,
                    email: null,
                    roles: user.roles,
                    isPhoneVerified: false,
                    isEmailVerified: false,
                },
                session: { id: session.id, deviceName: session.deviceName },
            });
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
    generateOtpCode(length) {
        return Math.floor(Math.random() * Math.pow(10, length))
            .toString()
            .padStart(length, '0');
    }
    parseExpiry(expiry) {
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match)
            return 30 * 24 * 60 * 60 * 1000;
        const [, value, unit] = match;
        const v = parseInt(value, 10);
        const multipliers = {
            s: 1000, m: 60000, h: 3600000, d: 86400000,
        };
        return v * (multipliers[unit] ?? 86400000);
    }
};
exports.RegisterUserUseCase = RegisterUserUseCase;
exports.RegisterUserUseCase = RegisterUserUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_interface_1.USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(profile_repository_interface_1.PROFILE_REPOSITORY)),
    __param(2, (0, common_1.Inject)(session_repository_interface_1.SESSION_REPOSITORY)),
    __param(3, (0, common_1.Inject)(refresh_token_repository_interface_1.REFRESH_TOKEN_REPOSITORY)),
    __param(4, (0, common_1.Inject)(otp_repository_interface_1.OTP_REPOSITORY)),
    __param(5, (0, common_1.Inject)(hashing_interface_1.HASHING_SERVICE)),
    __param(6, (0, common_1.Inject)(sms_provider_port_1.SMS_PROVIDER)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object, Object, token_service_1.TokenService,
        config_1.ConfigService,
        audit_log_service_1.AuditLogService])
], RegisterUserUseCase);
let AuthenticateUserUseCase = class AuthenticateUserUseCase {
    constructor(users, sessions, refreshTokens, hasher, tokenService, configService, auditLog) {
        this.users = users;
        this.sessions = sessions;
        this.refreshTokens = refreshTokens;
        this.hasher = hasher;
        this.tokenService = tokenService;
        this.configService = configService;
        this.auditLog = auditLog;
    }
    async execute(input) {
        try {
            const user = await this.users.findByIdentifier(input.identifier);
            if (!user)
                return result_1.Result.fail(new identity_errors_1.InvalidCredentialsError());
            if (!user.isActive)
                return result_1.Result.fail(new identity_errors_1.AccountInactiveError());
            if (user.isLocked())
                return result_1.Result.fail(new identity_errors_1.AccountLockedError(user.lockedUntil));
            const passwordMatch = await this.hasher.compare(input.password, user.passwordHash);
            if (!passwordMatch) {
                user.recordFailedLogin();
                const maxAttempts = this.configService.get('app.lockout.maxAttempts') ?? 5;
                if (user.failedLoginAttempts >= maxAttempts) {
                    const lockDuration = this.configService.get('app.lockout.durationMinutes') ?? 30;
                    user.lock(new Date(Date.now() + lockDuration * 60 * 1000));
                }
                await this.users.save(user);
                return result_1.Result.fail(new identity_errors_1.InvalidCredentialsError());
            }
            user.updateLastLogin();
            await this.users.save(user);
            const session = session_entity_1.Session.create({
                id: (0, uuid_1.v4)(),
                userId: user.id,
                deviceId: input.deviceId,
                deviceName: input.deviceName,
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
            });
            await this.sessions.save(session);
            const familyId = (0, uuid_1.v4)();
            const accessToken = this.tokenService.generateAccessToken({
                userId: user.id,
                roles: user.roles,
                sessionId: session.id,
            });
            const rawRefreshToken = this.tokenService.generateRefreshToken({
                userId: user.id,
                sessionId: session.id,
                familyId,
            });
            const refreshTokenHash = await this.hasher.hash(rawRefreshToken);
            const expiryMs = 30 * 24 * 60 * 60 * 1000;
            const refreshToken = refresh_token_entity_1.RefreshToken.create({
                id: (0, uuid_1.v4)(),
                token: refreshTokenHash,
                userId: user.id,
                sessionId: session.id,
                familyId,
                expiresAt: new Date(Date.now() + expiryMs),
            });
            await this.refreshTokens.save(refreshToken);
            await this.auditLog.log({
                action: 'user.login',
                actorId: user.id,
                subjectType: 'User',
                subjectId: user.id,
                ipAddress: input.ipAddress,
            });
            return result_1.Result.ok({
                accessToken,
                refreshToken: rawRefreshToken,
                user: {
                    id: user.id,
                    phoneNumber: user.phoneNumber.value,
                    email: user.email?.value ?? null,
                    roles: user.roles,
                    isPhoneVerified: user.isPhoneVerified,
                    isEmailVerified: user.isEmailVerified,
                },
                session: { id: session.id, deviceName: session.deviceName },
            });
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
};
exports.AuthenticateUserUseCase = AuthenticateUserUseCase;
exports.AuthenticateUserUseCase = AuthenticateUserUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_interface_1.USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(session_repository_interface_1.SESSION_REPOSITORY)),
    __param(2, (0, common_1.Inject)(refresh_token_repository_interface_1.REFRESH_TOKEN_REPOSITORY)),
    __param(3, (0, common_1.Inject)(hashing_interface_1.HASHING_SERVICE)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, token_service_1.TokenService,
        config_1.ConfigService,
        audit_log_service_1.AuditLogService])
], AuthenticateUserUseCase);
let RefreshTokenUseCase = class RefreshTokenUseCase {
    constructor(users, sessions, refreshTokens, hasher, tokenService) {
        this.users = users;
        this.sessions = sessions;
        this.refreshTokens = refreshTokens;
        this.hasher = hasher;
        this.tokenService = tokenService;
    }
    async execute(input) {
        try {
            const payload = this.tokenService.verifyRefreshToken(input.refreshToken);
            if (!payload)
                return result_1.Result.fail(new identity_errors_1.RefreshTokenInvalidError());
            const storedToken = await this.refreshTokens.findByToken(await this.hasher.hash(input.refreshToken));
            if (!storedToken) {
                await this.refreshTokens.revokeFamily(payload.familyId);
                await this.sessions.revokeAllByUserId(payload.userId);
                return result_1.Result.fail(new identity_errors_1.RefreshTokenReuseDetectedError());
            }
            if (storedToken.isRevoked) {
                await this.refreshTokens.revokeFamily(storedToken.familyId);
                await this.sessions.revokeAllByUserId(storedToken.userId);
                return result_1.Result.fail(new identity_errors_1.RefreshTokenReuseDetectedError());
            }
            if (storedToken.isExpired()) {
                return result_1.Result.fail(new identity_errors_1.RefreshTokenInvalidError());
            }
            const user = await this.users.findById(storedToken.userId);
            if (!user || !user.isActive)
                return result_1.Result.fail(new identity_errors_1.RefreshTokenInvalidError());
            const newTokenId = (0, uuid_1.v4)();
            storedToken.replace(newTokenId);
            await this.refreshTokens.save(storedToken);
            const newAccessToken = this.tokenService.generateAccessToken({
                userId: user.id,
                roles: user.roles,
                sessionId: storedToken.sessionId,
            });
            const rawNewRefresh = this.tokenService.generateRefreshToken({
                userId: user.id,
                sessionId: storedToken.sessionId,
                familyId: storedToken.familyId,
            });
            const newRefreshHash = await this.hasher.hash(rawNewRefresh);
            const newRefreshToken = refresh_token_entity_1.RefreshToken.create({
                id: newTokenId,
                token: newRefreshHash,
                userId: user.id,
                sessionId: storedToken.sessionId,
                familyId: storedToken.familyId,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
            await this.refreshTokens.save(newRefreshToken);
            const session = await this.sessions.findById(storedToken.sessionId);
            return result_1.Result.ok({
                accessToken: newAccessToken,
                refreshToken: rawNewRefresh,
                user: {
                    id: user.id,
                    phoneNumber: user.phoneNumber.value,
                    email: user.email?.value ?? null,
                    roles: user.roles,
                    isPhoneVerified: user.isPhoneVerified,
                    isEmailVerified: user.isEmailVerified,
                },
                session: { id: storedToken.sessionId, deviceName: session?.deviceName ?? null },
            });
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
};
exports.RefreshTokenUseCase = RefreshTokenUseCase;
exports.RefreshTokenUseCase = RefreshTokenUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_interface_1.USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(session_repository_interface_1.SESSION_REPOSITORY)),
    __param(2, (0, common_1.Inject)(refresh_token_repository_interface_1.REFRESH_TOKEN_REPOSITORY)),
    __param(3, (0, common_1.Inject)(hashing_interface_1.HASHING_SERVICE)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, token_service_1.TokenService])
], RefreshTokenUseCase);
let LogoutUseCase = class LogoutUseCase {
    constructor(sessions, refreshTokens, auditLog) {
        this.sessions = sessions;
        this.refreshTokens = refreshTokens;
        this.auditLog = auditLog;
    }
    async execute(input) {
        try {
            const session = await this.sessions.findById(input.sessionId);
            if (session) {
                session.revoke();
                await this.sessions.save(session);
            }
            await this.refreshTokens.revokeAllBySessionId(input.sessionId);
            await this.auditLog.log({
                action: 'user.logout',
                actorId: input.userId,
                subjectType: 'Session',
                subjectId: input.sessionId,
            });
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
};
exports.LogoutUseCase = LogoutUseCase;
exports.LogoutUseCase = LogoutUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(session_repository_interface_1.SESSION_REPOSITORY)),
    __param(1, (0, common_1.Inject)(refresh_token_repository_interface_1.REFRESH_TOKEN_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, audit_log_service_1.AuditLogService])
], LogoutUseCase);
let RequestOtpUseCase = class RequestOtpUseCase {
    constructor(users, otps, hasher, sms, configService) {
        this.users = users;
        this.otps = otps;
        this.hasher = hasher;
        this.sms = sms;
        this.configService = configService;
    }
    async execute(input) {
        try {
            phone_number_vo_1.PhoneNumber.create(input.phoneNumber);
            const cooldown = this.configService.get('app.otp.resendCooldownSeconds') ?? 60;
            const existing = await this.otps.findLatestByPhoneAndPurpose(input.phoneNumber, input.purpose);
            if (existing && existing.isOnCooldown(cooldown)) {
                const remaining = Math.ceil(cooldown - (Date.now() - existing.lastSentAt.getTime()) / 1000);
                return result_1.Result.fail(new identity_errors_1.OtpResendCooldownError(remaining));
            }
            const user = await this.users.findByPhoneNumber(input.phoneNumber);
            const length = this.configService.get('app.otp.length') ?? 6;
            const otpCode = Math.floor(Math.random() * Math.pow(10, length))
                .toString()
                .padStart(length, '0');
            const otpHash = await this.hasher.hash(otpCode);
            const expiryMinutes = this.configService.get('app.otp.expiryMinutes') ?? 10;
            const otp = otp_entity_1.Otp.generate((0, uuid_1.v4)(), input.phoneNumber, user?.id ?? null, input.purpose, otpHash, expiryMinutes);
            await this.otps.save(otp);
            await this.sms.sendOtp(input.phoneNumber, otpCode, input.purpose);
            return result_1.Result.ok({ message: 'OTP sent successfully' });
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
};
exports.RequestOtpUseCase = RequestOtpUseCase;
exports.RequestOtpUseCase = RequestOtpUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_interface_1.USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(otp_repository_interface_1.OTP_REPOSITORY)),
    __param(2, (0, common_1.Inject)(hashing_interface_1.HASHING_SERVICE)),
    __param(3, (0, common_1.Inject)(sms_provider_port_1.SMS_PROVIDER)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, config_1.ConfigService])
], RequestOtpUseCase);
let VerifyOtpUseCase = class VerifyOtpUseCase {
    constructor(users, otps, hasher, configService) {
        this.users = users;
        this.otps = otps;
        this.hasher = hasher;
        this.configService = configService;
    }
    async execute(input) {
        try {
            const otp = await this.otps.findLatestByPhoneAndPurpose(input.phoneNumber, input.purpose);
            if (!otp || otp.isVerified)
                return result_1.Result.fail(new identity_errors_1.OtpInvalidError());
            if (otp.isExpired())
                return result_1.Result.fail(new identity_errors_1.OtpExpiredError());
            const maxAttempts = this.configService.get('app.otp.maxAttempts') ?? 5;
            if (otp.maxAttemptsReached(maxAttempts)) {
                return result_1.Result.fail(new identity_errors_1.OtpMaxAttemptsExceededError());
            }
            const isValid = await this.hasher.compare(input.code, otp.codeHash);
            if (!isValid) {
                otp.incrementAttempts();
                await this.otps.save(otp);
                return result_1.Result.fail(new identity_errors_1.OtpInvalidError());
            }
            otp.markVerified();
            await this.otps.save(otp);
            if (input.purpose === client_1.OtpPurpose.PHONE_VERIFICATION) {
                const user = await this.users.findByPhoneNumber(input.phoneNumber);
                if (user) {
                    user.verifyPhone();
                    await this.users.save(user);
                }
            }
            return result_1.Result.ok({ verified: true });
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
};
exports.VerifyOtpUseCase = VerifyOtpUseCase;
exports.VerifyOtpUseCase = VerifyOtpUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_interface_1.USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(otp_repository_interface_1.OTP_REPOSITORY)),
    __param(2, (0, common_1.Inject)(hashing_interface_1.HASHING_SERVICE)),
    __metadata("design:paramtypes", [Object, Object, Object, config_1.ConfigService])
], VerifyOtpUseCase);
let ForgotPasswordUseCase = class ForgotPasswordUseCase {
    constructor(users, otps, hasher, sms, configService) {
        this.users = users;
        this.otps = otps;
        this.hasher = hasher;
        this.sms = sms;
        this.configService = configService;
    }
    async execute(input) {
        try {
            const user = await this.users.findByPhoneNumber(input.phoneNumber);
            if (user && user.isActive) {
                const length = this.configService.get('app.otp.length') ?? 6;
                const otpCode = Math.floor(Math.random() * Math.pow(10, length))
                    .toString()
                    .padStart(length, '0');
                const otpHash = await this.hasher.hash(otpCode);
                const otp = otp_entity_1.Otp.generate((0, uuid_1.v4)(), input.phoneNumber, user.id, client_1.OtpPurpose.PASSWORD_RESET, otpHash, this.configService.get('app.otp.expiryMinutes') ?? 10);
                await this.otps.save(otp);
                await this.sms.sendOtp(input.phoneNumber, otpCode, client_1.OtpPurpose.PASSWORD_RESET);
            }
        }
        catch {
        }
        return result_1.Result.ok({ message: 'If that phone number is registered, you will receive an OTP.' });
    }
};
exports.ForgotPasswordUseCase = ForgotPasswordUseCase;
exports.ForgotPasswordUseCase = ForgotPasswordUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_interface_1.USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(otp_repository_interface_1.OTP_REPOSITORY)),
    __param(2, (0, common_1.Inject)(hashing_interface_1.HASHING_SERVICE)),
    __param(3, (0, common_1.Inject)(sms_provider_port_1.SMS_PROVIDER)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, config_1.ConfigService])
], ForgotPasswordUseCase);
let ResetPasswordUseCase = class ResetPasswordUseCase {
    constructor(users, sessions, refreshTokens, otps, hasher, configService, auditLog) {
        this.users = users;
        this.sessions = sessions;
        this.refreshTokens = refreshTokens;
        this.otps = otps;
        this.hasher = hasher;
        this.configService = configService;
        this.auditLog = auditLog;
    }
    async execute(input) {
        try {
            password_vo_1.Password.create(input.newPassword);
            const otp = await this.otps.findLatestByPhoneAndPurpose(input.phoneNumber, client_1.OtpPurpose.PASSWORD_RESET);
            if (!otp || otp.isVerified)
                return result_1.Result.fail(new identity_errors_1.OtpInvalidError());
            if (otp.isExpired())
                return result_1.Result.fail(new identity_errors_1.OtpExpiredError());
            const maxAttempts = this.configService.get('app.otp.maxAttempts') ?? 5;
            if (otp.maxAttemptsReached(maxAttempts)) {
                return result_1.Result.fail(new identity_errors_1.OtpMaxAttemptsExceededError());
            }
            const isValid = await this.hasher.compare(input.otpCode, otp.codeHash);
            if (!isValid) {
                otp.incrementAttempts();
                await this.otps.save(otp);
                return result_1.Result.fail(new identity_errors_1.OtpInvalidError());
            }
            const user = await this.users.findByPhoneNumber(input.phoneNumber);
            if (!user)
                return result_1.Result.fail(new identity_errors_1.UserNotFoundError());
            otp.markVerified();
            await this.otps.save(otp);
            const newHash = await this.hasher.hash(input.newPassword);
            user['_passwordHash'] = newHash;
            user.unlock();
            await this.users.save(user);
            await this.sessions.revokeAllByUserId(user.id);
            await this.refreshTokens.revokeAllByUserId(user.id);
            await this.auditLog.log({
                action: 'user.password_reset',
                actorId: user.id,
                subjectType: 'User',
                subjectId: user.id,
            });
            return result_1.Result.ok({ message: 'Password has been reset successfully. Please log in.' });
        }
        catch (error) {
            if (error instanceof app_error_1.AppError)
                return result_1.Result.fail(error);
            throw error;
        }
    }
};
exports.ResetPasswordUseCase = ResetPasswordUseCase;
exports.ResetPasswordUseCase = ResetPasswordUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_interface_1.USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(session_repository_interface_1.SESSION_REPOSITORY)),
    __param(2, (0, common_1.Inject)(refresh_token_repository_interface_1.REFRESH_TOKEN_REPOSITORY)),
    __param(3, (0, common_1.Inject)(otp_repository_interface_1.OTP_REPOSITORY)),
    __param(4, (0, common_1.Inject)(hashing_interface_1.HASHING_SERVICE)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, config_1.ConfigService,
        audit_log_service_1.AuditLogService])
], ResetPasswordUseCase);
let GetCurrentUserUseCase = class GetCurrentUserUseCase {
    constructor(users, profiles, capabilities) {
        this.users = users;
        this.profiles = profiles;
        this.capabilities = capabilities;
    }
    async execute(input) {
        const user = await this.users.findById(input.userId);
        if (!user)
            return result_1.Result.fail(new identity_errors_1.UserNotFoundError());
        const [profile, allCapabilities] = await Promise.all([
            this.profiles.findByUserId(input.userId),
            this.capabilities.findAllByUser(input.userId),
        ]);
        return result_1.Result.ok({ user, profile, capabilities: allCapabilities });
    }
};
exports.GetCurrentUserUseCase = GetCurrentUserUseCase;
exports.GetCurrentUserUseCase = GetCurrentUserUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_interface_1.USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(profile_repository_interface_1.PROFILE_REPOSITORY)),
    __param(2, (0, common_1.Inject)(user_capability_repository_interface_1.USER_CAPABILITY_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, Object])
], GetCurrentUserUseCase);
let CompleteProfileUseCase = class CompleteProfileUseCase {
    constructor(users, profiles) {
        this.users = users;
        this.profiles = profiles;
    }
    async execute(input) {
        const profile = await this.profiles.findByUserId(input.userId);
        if (!profile)
            return result_1.Result.fail(new identity_errors_1.ProfileNotFoundError());
        const user = await this.users.findById(input.userId);
        profile.update(input.fields);
        profile.refreshCompletion(user?.isPhoneVerified ?? false, user?.email !== null);
        await this.profiles.save(profile);
        return result_1.Result.ok(profile);
    }
};
exports.CompleteProfileUseCase = CompleteProfileUseCase;
exports.CompleteProfileUseCase = CompleteProfileUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_interface_1.USER_REPOSITORY)),
    __param(1, (0, common_1.Inject)(profile_repository_interface_1.PROFILE_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object])
], CompleteProfileUseCase);
let RequestCapabilityUseCase = class RequestCapabilityUseCase {
    constructor(capabilities, auditLog) {
        this.capabilities = capabilities;
        this.auditLog = auditLog;
        this.AUTO_APPROVE_TYPES = [
            client_1.CapabilityType.LIST_VEHICLES,
            client_1.CapabilityType.MANAGE_LISTINGS,
        ];
    }
    async execute(input) {
        const existing = await this.capabilities.findByUserAndType(input.userId, input.type);
        if (existing)
            return result_1.Result.fail(new identity_errors_1.CapabilityAlreadyRequestedError());
        const cap = user_capability_entity_1.UserCapability.create((0, uuid_1.v4)(), input.userId, input.type);
        if (this.AUTO_APPROVE_TYPES.includes(input.type)) {
            cap.approve();
        }
        await this.capabilities.save(cap);
        await this.auditLog.log({
            action: 'capability.requested',
            actorId: input.userId,
            subjectType: 'UserCapability',
            subjectId: cap.id,
            metadata: { type: input.type, autoApproved: cap.status === client_1.CapabilityStatus.ACTIVE },
        });
        return result_1.Result.ok(cap);
    }
};
exports.RequestCapabilityUseCase = RequestCapabilityUseCase;
exports.RequestCapabilityUseCase = RequestCapabilityUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_capability_repository_interface_1.USER_CAPABILITY_REPOSITORY)),
    __metadata("design:paramtypes", [Object, audit_log_service_1.AuditLogService])
], RequestCapabilityUseCase);
let DecideCapabilityUseCase = class DecideCapabilityUseCase {
    constructor(capabilities, auditLog) {
        this.capabilities = capabilities;
        this.auditLog = auditLog;
    }
    async execute(input) {
        const cap = await this.capabilities.findById(input.capabilityId);
        if (!cap)
            return result_1.Result.fail(new identity_errors_1.CapabilityNotFoundError());
        switch (input.decision) {
            case 'approve':
                cap.approve();
                break;
            case 'reject':
                cap.reject(input.reason ?? 'Rejected by admin');
                break;
            case 'suspend':
                cap.suspend(input.reason ?? 'Suspended by admin');
                break;
            case 'reactivate':
                cap.reactivate();
                break;
            case 'revoke':
                cap.revoke(input.reason ?? 'Revoked by admin');
                break;
        }
        await this.capabilities.save(cap);
        await this.auditLog.log({
            action: `capability.${input.decision}d`,
            actorId: input.adminId,
            subjectType: 'UserCapability',
            subjectId: cap.id,
            metadata: { reason: input.reason },
        });
        return result_1.Result.ok(cap);
    }
};
exports.DecideCapabilityUseCase = DecideCapabilityUseCase;
exports.DecideCapabilityUseCase = DecideCapabilityUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_capability_repository_interface_1.USER_CAPABILITY_REPOSITORY)),
    __metadata("design:paramtypes", [Object, audit_log_service_1.AuditLogService])
], DecideCapabilityUseCase);
let ListSessionsUseCase = class ListSessionsUseCase {
    constructor(sessions) {
        this.sessions = sessions;
    }
    async execute(input) {
        const sessions = await this.sessions.findAllActiveByUserId(input.userId);
        const result = sessions.map((s) => Object.assign(s, {
            isCurrent: s.id === input.currentSessionId,
        }));
        return result_1.Result.ok(result);
    }
};
exports.ListSessionsUseCase = ListSessionsUseCase;
exports.ListSessionsUseCase = ListSessionsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(session_repository_interface_1.SESSION_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], ListSessionsUseCase);
let RevokeSessionUseCase = class RevokeSessionUseCase {
    constructor(sessions, refreshTokens, auditLog) {
        this.sessions = sessions;
        this.refreshTokens = refreshTokens;
        this.auditLog = auditLog;
    }
    async execute(input) {
        const session = await this.sessions.findById(input.sessionId);
        if (!session || session.userId !== input.userId) {
            return result_1.Result.fail(new identity_errors_1.SessionNotFoundError());
        }
        session.revoke();
        await this.sessions.save(session);
        await this.refreshTokens.revokeAllBySessionId(input.sessionId);
        await this.auditLog.log({
            action: 'session.revoked',
            actorId: input.userId,
            subjectType: 'Session',
            subjectId: input.sessionId,
        });
        return result_1.Result.ok(undefined);
    }
};
exports.RevokeSessionUseCase = RevokeSessionUseCase;
exports.RevokeSessionUseCase = RevokeSessionUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(session_repository_interface_1.SESSION_REPOSITORY)),
    __param(1, (0, common_1.Inject)(refresh_token_repository_interface_1.REFRESH_TOKEN_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, audit_log_service_1.AuditLogService])
], RevokeSessionUseCase);
//# sourceMappingURL=identity.use-cases.js.map