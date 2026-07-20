import { Module } from '@nestjs/common';

import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { PROFILE_REPOSITORY } from './domain/repositories/profile.repository.interface';
import { SESSION_REPOSITORY } from './domain/repositories/session.repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories/refresh-token.repository.interface';
import { OTP_REPOSITORY } from './domain/repositories/otp.repository.interface';
import { USER_CAPABILITY_REPOSITORY } from './domain/repositories/user-capability.repository.interface';
import { SMS_PROVIDER } from './application/ports/sms-provider.port';
import { EMAIL_PROVIDER } from './application/ports/email-provider.port';

import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { PrismaProfileRepository } from './infrastructure/repositories/prisma-profile.repository';
import { PrismaSessionRepository } from './infrastructure/repositories/prisma-session.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/prisma-refresh-token.repository';
import { PrismaOtpRepository } from './infrastructure/repositories/prisma-otp.repository';
import { PrismaUserCapabilityRepository } from './infrastructure/repositories/prisma-user-capability.repository';
import { ConsoleSmsProvider } from './infrastructure/providers/console-sms.provider';
import { ConsoleEmailProvider } from './infrastructure/providers/console-email.provider';

import {
  RegisterUserUseCase,
  AuthenticateUserUseCase,
  RefreshTokenUseCase,
  LogoutUseCase,
  RequestOtpUseCase,
  VerifyOtpUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  GetCurrentUserUseCase,
  CompleteProfileUseCase,
  RequestCapabilityUseCase,
  DecideCapabilityUseCase,
  ListSessionsUseCase,
  RevokeSessionUseCase,
} from './application/use-cases/identity.use-cases';

import {
  AuthController,
  ProfileController,
  SessionController,
  CapabilityController,
} from './presentation/controllers/identity.controllers';

@Module({
  controllers: [
    AuthController,
    ProfileController,
    SessionController,
    CapabilityController,
  ],
  providers: [
    // Repositories
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: PROFILE_REPOSITORY, useClass: PrismaProfileRepository },
    { provide: SESSION_REPOSITORY, useClass: PrismaSessionRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    { provide: OTP_REPOSITORY, useClass: PrismaOtpRepository },
    { provide: USER_CAPABILITY_REPOSITORY, useClass: PrismaUserCapabilityRepository },

    // Providers
    { provide: SMS_PROVIDER, useClass: ConsoleSmsProvider },
    { provide: EMAIL_PROVIDER, useClass: ConsoleEmailProvider },

    // Use Cases
    RegisterUserUseCase,
    AuthenticateUserUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    RequestOtpUseCase,
    VerifyOtpUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    GetCurrentUserUseCase,
    CompleteProfileUseCase,
    RequestCapabilityUseCase,
    DecideCapabilityUseCase,
    ListSessionsUseCase,
    RevokeSessionUseCase,
  ],
  exports: [
    USER_REPOSITORY,
    PROFILE_REPOSITORY,
    SESSION_REPOSITORY,
    USER_CAPABILITY_REPOSITORY,
  ],
})
export class IdentityModule {}
