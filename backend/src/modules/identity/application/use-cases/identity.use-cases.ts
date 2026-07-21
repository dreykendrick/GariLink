import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { OtpPurpose, CapabilityStatus, CapabilityType, UserRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

import { Result } from '../../../../shared/domain/result';
import { AppError } from '../../../../core/errors/app-error';
import { IPasswordHasher, HASHING_SERVICE } from '../../../../core/security/hashing.interface';
import { TokenService } from '../../../../core/security/token.service';
import { AuditLogService } from '../../../audit/audit-log.service';

import { User } from '../../domain/entities/user.entity';
import { Profile } from '../../domain/entities/profile.entity';
import { Session } from '../../domain/entities/session.entity';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { Otp } from '../../domain/entities/otp.entity';
import { UserCapability } from '../../domain/entities/user-capability.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { PhoneNumber } from '../../domain/value-objects/phone-number.vo';
import { Password } from '../../domain/value-objects/password.vo';

import {
  USER_REPOSITORY,
  IUserRepository,
} from '../../domain/repositories/user.repository.interface';
import {
  PROFILE_REPOSITORY,
  IProfileRepository,
} from '../../domain/repositories/profile.repository.interface';
import {
  SESSION_REPOSITORY,
  ISessionRepository,
} from '../../domain/repositories/session.repository.interface';
import {
  REFRESH_TOKEN_REPOSITORY,
  IRefreshTokenRepository,
} from '../../domain/repositories/refresh-token.repository.interface';
import {
  OTP_REPOSITORY,
  IOtpRepository,
} from '../../domain/repositories/otp.repository.interface';
import {
  USER_CAPABILITY_REPOSITORY,
  IUserCapabilityRepository,
} from '../../domain/repositories/user-capability.repository.interface';

import { SMS_PROVIDER, ISmsProvider } from '../ports/sms-provider.port';

import {
  UserNotFoundError,
  EmailAlreadyExistsError,
  PhoneAlreadyExistsError,
  InvalidCredentialsError,
  AccountLockedError,
  AccountInactiveError,
  OtpInvalidError,
  OtpExpiredError,
  OtpMaxAttemptsExceededError,
  OtpResendCooldownError,
  RefreshTokenInvalidError,
  RefreshTokenReuseDetectedError,
  SessionNotFoundError,
  CapabilityAlreadyRequestedError,
  CapabilityNotFoundError,
  ProfileNotFoundError,
} from '../../domain/errors/identity.errors';

// ─── Shared response types ────────────────────────────────────────────────────

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
  session: { id: string; deviceName: string | null };
}

// ─── RegisterUserUseCase ─────────────────────────────────────────────────────

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PROFILE_REPOSITORY) private readonly profiles: IProfileRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: IRefreshTokenRepository,
    @Inject(OTP_REPOSITORY) private readonly otps: IOtpRepository,
    @Inject(HASHING_SERVICE) private readonly hasher: IPasswordHasher,
    @Inject(SMS_PROVIDER) private readonly sms: ISmsProvider,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(input: {
    phoneNumber: string;
    password: string;
    firstName?: string;
    lastName?: string;
    deviceId?: string;
    deviceName?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<Result<AuthResponse, AppError>> {
    try {
      // 1. Validate value objects
      const phoneVO = PhoneNumber.create(input.phoneNumber);
      Password.create(input.password); // validates only

      // 2. Check uniqueness
      const existing = await this.users.findByPhoneNumber(phoneVO.value);
      if (existing) return Result.fail(new PhoneAlreadyExistsError());

      // 3. Hash password
      const passwordHash = await this.hasher.hash(input.password);

      // 4. Create User aggregate
      const userId = uuidv4();
      const user = User.create(
        {
          email: null,
          phoneNumber: phoneVO,
          passwordHash,
          roles: [UserRole.CUSTOMER],
          isEmailVerified: false,
          isPhoneVerified: false,
          isActive: true,
          lastLoginAt: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
        userId,
      );
      await this.users.save(user);

      // 5. Create Profile
      const profile = Profile.create(uuidv4(), userId);
      if (input.firstName) profile.firstName = input.firstName;
      if (input.lastName) profile.lastName = input.lastName;
      await this.profiles.save(profile);

      // 6. Create Session
      const session = Session.create({
        id: uuidv4(),
        userId,
        deviceId: input.deviceId,
        deviceName: input.deviceName,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
      await this.sessions.save(session);

      // 7. Issue tokens
      const familyId = uuidv4();
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

      const expiryMs = this.parseExpiry(
        this.configService.get<string>('app.jwt.refreshExpiresIn') ?? '30d',
      );
      const refreshToken = RefreshToken.create({
        id: uuidv4(),
        token: refreshTokenHash,
        userId,
        sessionId: session.id,
        familyId,
        expiresAt: new Date(Date.now() + expiryMs),
      });
      await this.refreshTokens.save(refreshToken);

      // 8. Send phone verification OTP
      const otpCode = this.generateOtpCode(
        this.configService.get<number>('app.otp.length') ?? 6,
      );
      const otpHash = await this.hasher.hash(otpCode);
      const otp = Otp.generate(
        uuidv4(),
        phoneVO.value,
        userId,
        OtpPurpose.PHONE_VERIFICATION,
        otpHash,
        this.configService.get<number>('app.otp.expiryMinutes') ?? 10,
      );
      await this.otps.save(otp);
      await this.sms.sendOtp(phoneVO.value, otpCode, OtpPurpose.PHONE_VERIFICATION);

      // 9. Audit log
      await this.auditLog.log({
        action: 'user.registered',
        actorId: userId,
        subjectType: 'User',
        subjectId: userId,
        ipAddress: input.ipAddress,
      });

      return Result.ok({
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
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }

  private generateOtpCode(length: number): string {
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, '0');
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 30 * 24 * 60 * 60 * 1000;
    const [, value, unit] = match;
    const v = parseInt(value, 10);
    const multipliers: Record<string, number> = {
      s: 1000, m: 60000, h: 3600000, d: 86400000,
    };
    return v * (multipliers[unit] ?? 86400000);
  }
}

// ─── AuthenticateUserUseCase ──────────────────────────────────────────────────

@Injectable()
export class AuthenticateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: IRefreshTokenRepository,
    @Inject(HASHING_SERVICE) private readonly hasher: IPasswordHasher,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(input: {
    identifier: string;
    password: string;
    deviceId?: string;
    deviceName?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<Result<AuthResponse, AppError>> {
    try {
      const user = await this.users.findByIdentifier(input.identifier);
      if (!user) return Result.fail(new InvalidCredentialsError());
      if (!user.isActive) return Result.fail(new AccountInactiveError());
      if (user.isLocked()) return Result.fail(new AccountLockedError(user.lockedUntil!));

      const passwordMatch = await this.hasher.compare(input.password, user.passwordHash);
      if (!passwordMatch) {
        user.recordFailedLogin();
        const maxAttempts = this.configService.get<number>('app.lockout.maxAttempts') ?? 5;
        if (user.failedLoginAttempts >= maxAttempts) {
          const lockDuration = this.configService.get<number>('app.lockout.durationMinutes') ?? 30;
          user.lock(new Date(Date.now() + lockDuration * 60 * 1000));
        }
        await this.users.save(user);
        return Result.fail(new InvalidCredentialsError());
      }

      user.updateLastLogin();
      await this.users.save(user);

      const session = Session.create({
        id: uuidv4(),
        userId: user.id,
        deviceId: input.deviceId,
        deviceName: input.deviceName,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      });
      await this.sessions.save(session);

      const familyId = uuidv4();
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

      const expiryMs = 30 * 24 * 60 * 60 * 1000; // 30d default
      const refreshToken = RefreshToken.create({
        id: uuidv4(),
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

      return Result.ok({
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
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }
}

// ─── RefreshTokenUseCase ──────────────────────────────────────────────────────

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: IRefreshTokenRepository,
    @Inject(HASHING_SERVICE) private readonly hasher: IPasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: { refreshToken: string }): Promise<Result<AuthResponse, AppError>> {
    try {
      const payload = this.tokenService.verifyRefreshToken(input.refreshToken);
      if (!payload) return Result.fail(new RefreshTokenInvalidError());

      // Find stored token by comparing hash
      const storedToken = await this.refreshTokens.findByToken(
        await this.hasher.hash(input.refreshToken),
      );

      if (!storedToken) {
        // Token not found — check if family exists (reuse detection)
        await this.refreshTokens.revokeFamily(payload.familyId);
        await this.sessions.revokeAllByUserId(payload.userId);
        return Result.fail(new RefreshTokenReuseDetectedError());
      }

      if (storedToken.isRevoked) {
        await this.refreshTokens.revokeFamily(storedToken.familyId);
        await this.sessions.revokeAllByUserId(storedToken.userId);
        return Result.fail(new RefreshTokenReuseDetectedError());
      }

      if (storedToken.isExpired()) {
        return Result.fail(new RefreshTokenInvalidError());
      }

      const user = await this.users.findById(storedToken.userId);
      if (!user || !user.isActive) return Result.fail(new RefreshTokenInvalidError());

      // Rotate: revoke old, issue new
      const newTokenId = uuidv4();
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

      const newRefreshToken = RefreshToken.create({
        id: newTokenId,
        token: newRefreshHash,
        userId: user.id,
        sessionId: storedToken.sessionId,
        familyId: storedToken.familyId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      await this.refreshTokens.save(newRefreshToken);

      const session = await this.sessions.findById(storedToken.sessionId);
      return Result.ok({
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
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }
}

// ─── LogoutUseCase ────────────────────────────────────────────────────────────

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(input: { sessionId: string; userId: string }): Promise<Result<void, AppError>> {
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
      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }
}

// ─── RequestOtpUseCase ───────────────────────────────────────────────────────

@Injectable()
export class RequestOtpUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(OTP_REPOSITORY) private readonly otps: IOtpRepository,
    @Inject(HASHING_SERVICE) private readonly hasher: IPasswordHasher,
    @Inject(SMS_PROVIDER) private readonly sms: ISmsProvider,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: {
    phoneNumber: string;
    purpose: OtpPurpose;
  }): Promise<Result<{ message: string }, AppError>> {
    try {
      PhoneNumber.create(input.phoneNumber);

      const cooldown = this.configService.get<number>('app.otp.resendCooldownSeconds') ?? 60;
      const existing = await this.otps.findLatestByPhoneAndPurpose(
        input.phoneNumber,
        input.purpose,
      );

      if (existing && existing.isOnCooldown(cooldown)) {
        const remaining = Math.ceil(
          cooldown - (Date.now() - existing.lastSentAt.getTime()) / 1000,
        );
        return Result.fail(new OtpResendCooldownError(remaining));
      }

      const user = await this.users.findByPhoneNumber(input.phoneNumber);
      const length = this.configService.get<number>('app.otp.length') ?? 6;
      const otpCode = Math.floor(Math.random() * Math.pow(10, length))
        .toString()
        .padStart(length, '0');
      const otpHash = await this.hasher.hash(otpCode);
      const expiryMinutes = this.configService.get<number>('app.otp.expiryMinutes') ?? 10;

      const otp = Otp.generate(
        uuidv4(),
        input.phoneNumber,
        user?.id ?? null,
        input.purpose,
        otpHash,
        expiryMinutes,
      );
      await this.otps.save(otp);
      await this.sms.sendOtp(input.phoneNumber, otpCode, input.purpose);

      return Result.ok({ message: 'OTP sent successfully' });
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }
}

// ─── VerifyOtpUseCase ─────────────────────────────────────────────────────────

@Injectable()
export class VerifyOtpUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(OTP_REPOSITORY) private readonly otps: IOtpRepository,
    @Inject(HASHING_SERVICE) private readonly hasher: IPasswordHasher,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: {
    phoneNumber: string;
    purpose: OtpPurpose;
    code: string;
  }): Promise<Result<{ verified: boolean }, AppError>> {
    try {
      const otp = await this.otps.findLatestByPhoneAndPurpose(
        input.phoneNumber,
        input.purpose,
      );
      if (!otp || otp.isVerified) return Result.fail(new OtpInvalidError());
      if (otp.isExpired()) return Result.fail(new OtpExpiredError());

      const maxAttempts = this.configService.get<number>('app.otp.maxAttempts') ?? 5;
      if (otp.maxAttemptsReached(maxAttempts)) {
        return Result.fail(new OtpMaxAttemptsExceededError());
      }

      const isValid = await this.hasher.compare(input.code, otp.codeHash);
      if (!isValid) {
        otp.incrementAttempts();
        await this.otps.save(otp);
        return Result.fail(new OtpInvalidError());
      }

      otp.markVerified();
      await this.otps.save(otp);

      if (input.purpose === OtpPurpose.PHONE_VERIFICATION) {
        const user = await this.users.findByPhoneNumber(input.phoneNumber);
        if (user) {
          user.verifyPhone();
          await this.users.save(user);
        }
      }

      return Result.ok({ verified: true });
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }
}

// ─── ForgotPasswordUseCase ───────────────────────────────────────────────────

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(OTP_REPOSITORY) private readonly otps: IOtpRepository,
    @Inject(HASHING_SERVICE) private readonly hasher: IPasswordHasher,
    @Inject(SMS_PROVIDER) private readonly sms: ISmsProvider,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: {
    phoneNumber: string;
  }): Promise<Result<{ message: string }, AppError>> {
    // Always return success — enumeration safe
    try {
      const user = await this.users.findByPhoneNumber(input.phoneNumber);
      if (user && user.isActive) {
        const length = this.configService.get<number>('app.otp.length') ?? 6;
        const otpCode = Math.floor(Math.random() * Math.pow(10, length))
          .toString()
          .padStart(length, '0');
        const otpHash = await this.hasher.hash(otpCode);
        const otp = Otp.generate(
          uuidv4(),
          input.phoneNumber,
          user.id,
          OtpPurpose.PASSWORD_RESET,
          otpHash,
          this.configService.get<number>('app.otp.expiryMinutes') ?? 10,
        );
        await this.otps.save(otp);
        await this.sms.sendOtp(input.phoneNumber, otpCode, OtpPurpose.PASSWORD_RESET);
      }
    } catch {
      // Intentionally swallow errors for enumeration safety
    }
    return Result.ok({ message: 'If that phone number is registered, you will receive an OTP.' });
  }
}

// ─── ResetPasswordUseCase ────────────────────────────────────────────────────

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: IRefreshTokenRepository,
    @Inject(OTP_REPOSITORY) private readonly otps: IOtpRepository,
    @Inject(HASHING_SERVICE) private readonly hasher: IPasswordHasher,
    private readonly configService: ConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(input: {
    phoneNumber: string;
    otpCode: string;
    newPassword: string;
  }): Promise<Result<{ message: string }, AppError>> {
    try {
      Password.create(input.newPassword); // validates complexity

      const otp = await this.otps.findLatestByPhoneAndPurpose(
        input.phoneNumber,
        OtpPurpose.PASSWORD_RESET,
      );
      if (!otp || otp.isVerified) return Result.fail(new OtpInvalidError());
      if (otp.isExpired()) return Result.fail(new OtpExpiredError());

      const maxAttempts = this.configService.get<number>('app.otp.maxAttempts') ?? 5;
      if (otp.maxAttemptsReached(maxAttempts)) {
        return Result.fail(new OtpMaxAttemptsExceededError());
      }

      const isValid = await this.hasher.compare(input.otpCode, otp.codeHash);
      if (!isValid) {
        otp.incrementAttempts();
        await this.otps.save(otp);
        return Result.fail(new OtpInvalidError());
      }

      const user = await this.users.findByPhoneNumber(input.phoneNumber);
      if (!user) return Result.fail(new UserNotFoundError());

      otp.markVerified();
      await this.otps.save(otp);

      // Update password
      const newHash = await this.hasher.hash(input.newPassword);
      (user as unknown as { _passwordHash: string })['_passwordHash'] = newHash;
      user.unlock();
      await this.users.save(user);

      // Revoke all sessions and tokens
      await this.sessions.revokeAllByUserId(user.id);
      await this.refreshTokens.revokeAllByUserId(user.id);

      await this.auditLog.log({
        action: 'user.password_reset',
        actorId: user.id,
        subjectType: 'User',
        subjectId: user.id,
      });

      return Result.ok({ message: 'Password has been reset successfully. Please log in.' });
    } catch (error) {
      if (error instanceof AppError) return Result.fail(error);
      throw error;
    }
  }
}

// ─── GetCurrentUserUseCase ────────────────────────────────────────────────────

@Injectable()
export class GetCurrentUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PROFILE_REPOSITORY) private readonly profiles: IProfileRepository,
    @Inject(USER_CAPABILITY_REPOSITORY)
    private readonly capabilities: IUserCapabilityRepository,
  ) {}

  async execute(input: { userId: string }): Promise<
    Result<{
      user: User;
      profile: Profile | null;
      capabilities: UserCapability[];
    }, AppError>
  > {
    const user = await this.users.findById(input.userId);
    if (!user) return Result.fail(new UserNotFoundError());

    const [profile, allCapabilities] = await Promise.all([
      this.profiles.findByUserId(input.userId),
      this.capabilities.findAllByUser(input.userId),
    ]);

    return Result.ok({ user, profile, capabilities: allCapabilities });
  }
}

// ─── CompleteProfileUseCase ───────────────────────────────────────────────────

@Injectable()
export class CompleteProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(PROFILE_REPOSITORY) private readonly profiles: IProfileRepository,
  ) {}

  async execute(input: {
    userId: string;
    fields: Record<string, unknown>;
  }): Promise<Result<Profile, AppError>> {
    const profile = await this.profiles.findByUserId(input.userId);
    if (!profile) return Result.fail(new ProfileNotFoundError());

    const user = await this.users.findById(input.userId);

    profile.update(input.fields as Parameters<Profile['update']>[0]);
    profile.refreshCompletion(
      user?.isPhoneVerified ?? false,
      user?.email !== null,
    );
    await this.profiles.save(profile);

    return Result.ok(profile);
  }
}

// ─── RequestCapabilityUseCase ────────────────────────────────────────────────

@Injectable()
export class RequestCapabilityUseCase {
  constructor(
    @Inject(USER_CAPABILITY_REPOSITORY)
    private readonly capabilities: IUserCapabilityRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  private readonly AUTO_APPROVE_TYPES: CapabilityType[] = [
    CapabilityType.LIST_VEHICLES,
    CapabilityType.MANAGE_LISTINGS,
  ];

  async execute(input: {
    userId: string;
    type: CapabilityType;
  }): Promise<Result<UserCapability, AppError>> {
    const existing = await this.capabilities.findByUserAndType(
      input.userId,
      input.type,
    );
    if (existing) return Result.fail(new CapabilityAlreadyRequestedError());

    const cap = UserCapability.create(uuidv4(), input.userId, input.type);
    if (this.AUTO_APPROVE_TYPES.includes(input.type)) {
      cap.approve();
    }
    await this.capabilities.save(cap);

    await this.auditLog.log({
      action: 'capability.requested',
      actorId: input.userId,
      subjectType: 'UserCapability',
      subjectId: cap.id,
      metadata: { type: input.type, autoApproved: cap.status === CapabilityStatus.ACTIVE },
    });

    return Result.ok(cap);
  }
}

// ─── DecideCapabilityUseCase ─────────────────────────────────────────────────

@Injectable()
export class DecideCapabilityUseCase {
  constructor(
    @Inject(USER_CAPABILITY_REPOSITORY)
    private readonly capabilities: IUserCapabilityRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(input: {
    capabilityId: string;
    decision: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'revoke';
    adminId: string;
    reason?: string;
  }): Promise<Result<UserCapability, AppError>> {
    const cap = await this.capabilities.findById(input.capabilityId);
    if (!cap) return Result.fail(new CapabilityNotFoundError());

    switch (input.decision) {
      case 'approve': cap.approve(); break;
      case 'reject': cap.reject(input.reason ?? 'Rejected by admin'); break;
      case 'suspend': cap.suspend(input.reason ?? 'Suspended by admin'); break;
      case 'reactivate': cap.reactivate(); break;
      case 'revoke': cap.revoke(input.reason ?? 'Revoked by admin'); break;
    }
    await this.capabilities.save(cap);

    await this.auditLog.log({
      action: `capability.${input.decision}d`,
      actorId: input.adminId,
      subjectType: 'UserCapability',
      subjectId: cap.id,
      metadata: { reason: input.reason },
    });

    return Result.ok(cap);
  }
}

// ─── ListSessionsUseCase ──────────────────────────────────────────────────────

@Injectable()
export class ListSessionsUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
  ) {}

  async execute(input: { userId: string; currentSessionId: string }): Promise<
    Result<Array<Session & { isCurrent: boolean }>, AppError>
  > {
    const sessions = await this.sessions.findAllActiveByUserId(input.userId);
    const result = sessions.map((s) => Object.assign(s, {
      isCurrent: s.id === input.currentSessionId,
    }));
    return Result.ok(result);
  }
}

// ─── RevokeSessionUseCase ────────────────────────────────────────────────────

@Injectable()
export class RevokeSessionUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(input: {
    sessionId: string;
    userId: string;
  }): Promise<Result<void, AppError>> {
    const session = await this.sessions.findById(input.sessionId);
    if (!session || session.userId !== input.userId) {
      return Result.fail(new SessionNotFoundError());
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

    return Result.ok(undefined);
  }
}
