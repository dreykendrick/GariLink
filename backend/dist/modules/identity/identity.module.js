"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityModule = void 0;
const common_1 = require("@nestjs/common");
const user_repository_interface_1 = require("./domain/repositories/user.repository.interface");
const profile_repository_interface_1 = require("./domain/repositories/profile.repository.interface");
const session_repository_interface_1 = require("./domain/repositories/session.repository.interface");
const refresh_token_repository_interface_1 = require("./domain/repositories/refresh-token.repository.interface");
const otp_repository_interface_1 = require("./domain/repositories/otp.repository.interface");
const user_capability_repository_interface_1 = require("./domain/repositories/user-capability.repository.interface");
const sms_provider_port_1 = require("./application/ports/sms-provider.port");
const email_provider_port_1 = require("./application/ports/email-provider.port");
const prisma_user_repository_1 = require("./infrastructure/repositories/prisma-user.repository");
const prisma_profile_repository_1 = require("./infrastructure/repositories/prisma-profile.repository");
const prisma_session_repository_1 = require("./infrastructure/repositories/prisma-session.repository");
const prisma_refresh_token_repository_1 = require("./infrastructure/repositories/prisma-refresh-token.repository");
const prisma_otp_repository_1 = require("./infrastructure/repositories/prisma-otp.repository");
const prisma_user_capability_repository_1 = require("./infrastructure/repositories/prisma-user-capability.repository");
const console_sms_provider_1 = require("./infrastructure/providers/console-sms.provider");
const console_email_provider_1 = require("./infrastructure/providers/console-email.provider");
const identity_use_cases_1 = require("./application/use-cases/identity.use-cases");
const identity_controllers_1 = require("./presentation/controllers/identity.controllers");
let IdentityModule = class IdentityModule {
};
exports.IdentityModule = IdentityModule;
exports.IdentityModule = IdentityModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            identity_controllers_1.AuthController,
            identity_controllers_1.ProfileController,
            identity_controllers_1.SessionController,
            identity_controllers_1.CapabilityController,
        ],
        providers: [
            { provide: user_repository_interface_1.USER_REPOSITORY, useClass: prisma_user_repository_1.PrismaUserRepository },
            { provide: profile_repository_interface_1.PROFILE_REPOSITORY, useClass: prisma_profile_repository_1.PrismaProfileRepository },
            { provide: session_repository_interface_1.SESSION_REPOSITORY, useClass: prisma_session_repository_1.PrismaSessionRepository },
            { provide: refresh_token_repository_interface_1.REFRESH_TOKEN_REPOSITORY, useClass: prisma_refresh_token_repository_1.PrismaRefreshTokenRepository },
            { provide: otp_repository_interface_1.OTP_REPOSITORY, useClass: prisma_otp_repository_1.PrismaOtpRepository },
            { provide: user_capability_repository_interface_1.USER_CAPABILITY_REPOSITORY, useClass: prisma_user_capability_repository_1.PrismaUserCapabilityRepository },
            { provide: sms_provider_port_1.SMS_PROVIDER, useClass: console_sms_provider_1.ConsoleSmsProvider },
            { provide: email_provider_port_1.EMAIL_PROVIDER, useClass: console_email_provider_1.ConsoleEmailProvider },
            identity_use_cases_1.RegisterUserUseCase,
            identity_use_cases_1.AuthenticateUserUseCase,
            identity_use_cases_1.RefreshTokenUseCase,
            identity_use_cases_1.LogoutUseCase,
            identity_use_cases_1.RequestOtpUseCase,
            identity_use_cases_1.VerifyOtpUseCase,
            identity_use_cases_1.ForgotPasswordUseCase,
            identity_use_cases_1.ResetPasswordUseCase,
            identity_use_cases_1.GetCurrentUserUseCase,
            identity_use_cases_1.CompleteProfileUseCase,
            identity_use_cases_1.RequestCapabilityUseCase,
            identity_use_cases_1.DecideCapabilityUseCase,
            identity_use_cases_1.ListSessionsUseCase,
            identity_use_cases_1.RevokeSessionUseCase,
        ],
        exports: [
            user_repository_interface_1.USER_REPOSITORY,
            profile_repository_interface_1.PROFILE_REPOSITORY,
            session_repository_interface_1.SESSION_REPOSITORY,
            user_capability_repository_interface_1.USER_CAPABILITY_REPOSITORY,
        ],
    })
], IdentityModule);
//# sourceMappingURL=identity.module.js.map