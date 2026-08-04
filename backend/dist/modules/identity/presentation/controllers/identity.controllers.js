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
exports.CapabilityController = exports.SessionController = exports.ProfileController = exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../../../core/security/decorators/public.decorator");
const current_user_decorator_1 = require("../../../../core/security/decorators/current-user.decorator");
const roles_decorator_1 = require("../../../../core/security/decorators/roles.decorator");
const identity_dto_1 = require("../../application/dto/identity.dto");
const identity_use_cases_1 = require("../../application/use-cases/identity.use-cases");
const app_error_1 = require("../../../../core/errors/app-error");
let AuthController = class AuthController {
    constructor(register, login, refresh, logout, requestOtp, verifyOtp, forgotPassword, resetPassword) {
        this.register = register;
        this.login = login;
        this.refresh = refresh;
        this.logout = logout;
        this.requestOtp = requestOtp;
        this.verifyOtp = verifyOtp;
        this.forgotPassword = forgotPassword;
        this.resetPassword = resetPassword;
    }
    async registerUser(dto, req) {
        const result = await this.register.execute({
            ...dto,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async loginUser(dto, req) {
        const result = await this.login.execute({
            ...dto,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async refreshToken(dto) {
        const result = await this.refresh.execute(dto);
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async logoutUser(user) {
        const result = await this.logout.execute({
            sessionId: user.sessionId,
            userId: user.userId,
        });
        if (result.isFail)
            throw result.error;
    }
    async otpRequest(dto) {
        const result = await this.requestOtp.execute({
            phoneNumber: dto.phoneNumber,
            purpose: dto.purpose,
        });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async otpResend(dto) {
        const result = await this.requestOtp.execute({
            phoneNumber: dto.phoneNumber,
            purpose: dto.purpose,
        });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async otpVerify(dto) {
        const result = await this.verifyOtp.execute({
            phoneNumber: dto.phoneNumber,
            purpose: dto.purpose,
            code: dto.code,
        });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async forgotPass(dto) {
        const result = await this.forgotPassword.execute(dto);
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async resetPass(dto) {
        const result = await this.resetPassword.execute(dto);
        if (result.isFail)
            throw result.error;
        return result.value;
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [identity_dto_1.RegisterUserDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "registerUser", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login with phone/email + password' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [identity_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginUser", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [identity_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Logout current session' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logoutUser", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('otp/request'),
    (0, swagger_1.ApiOperation)({ summary: 'Request an OTP' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [identity_dto_1.RequestOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "otpRequest", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('otp/resend'),
    (0, swagger_1.ApiOperation)({ summary: 'Resend OTP (alias for request)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [identity_dto_1.RequestOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "otpResend", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('otp/verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify an OTP' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [identity_dto_1.VerifyOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "otpVerify", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('password/forgot'),
    (0, swagger_1.ApiOperation)({ summary: 'Request password reset OTP' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [identity_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPass", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('password/reset'),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password with OTP' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [identity_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPass", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [identity_use_cases_1.RegisterUserUseCase,
        identity_use_cases_1.AuthenticateUserUseCase,
        identity_use_cases_1.RefreshTokenUseCase,
        identity_use_cases_1.LogoutUseCase,
        identity_use_cases_1.RequestOtpUseCase,
        identity_use_cases_1.VerifyOtpUseCase,
        identity_use_cases_1.ForgotPasswordUseCase,
        identity_use_cases_1.ResetPasswordUseCase])
], AuthController);
let ProfileController = class ProfileController {
    constructor(getCurrentUser, completeProfile) {
        this.getCurrentUser = getCurrentUser;
        this.completeProfile = completeProfile;
    }
    async getMe(user) {
        const result = await this.getCurrentUser.execute({ userId: user.userId });
        if (result.isFail)
            throw result.error;
        const { user: u, profile, capabilities } = result.value;
        return {
            id: u.id,
            phoneNumber: u.phoneNumber.value,
            email: u.email?.value ?? null,
            roles: u.roles,
            isPhoneVerified: u.isPhoneVerified,
            isEmailVerified: u.isEmailVerified,
            profile,
            capabilities: capabilities.filter((c) => c.isActive()),
        };
    }
    async updateProfile(user, dto) {
        const result = await this.completeProfile.execute({
            userId: user.userId,
            fields: dto,
        });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
};
exports.ProfileController = ProfileController;
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current authenticated user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update profile fields' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, identity_dto_1.CompleteProfileDto]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "updateProfile", null);
exports.ProfileController = ProfileController = __decorate([
    (0, swagger_1.ApiTags)('Profile'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [identity_use_cases_1.GetCurrentUserUseCase,
        identity_use_cases_1.CompleteProfileUseCase])
], ProfileController);
let SessionController = class SessionController {
    constructor(listSessions, revokeSession) {
        this.listSessions = listSessions;
        this.revokeSession = revokeSession;
    }
    async list(user) {
        const result = await this.listSessions.execute({
            userId: user.userId,
            currentSessionId: user.sessionId,
        });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async revoke(id, user) {
        const result = await this.revokeSession.execute({
            sessionId: id,
            userId: user.userId,
        });
        if (result.isFail)
            throw result.error;
    }
};
exports.SessionController = SessionController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List active sessions' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "list", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke a session' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "revoke", null);
exports.SessionController = SessionController = __decorate([
    (0, swagger_1.ApiTags)('Sessions'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('sessions'),
    __metadata("design:paramtypes", [identity_use_cases_1.ListSessionsUseCase,
        identity_use_cases_1.RevokeSessionUseCase])
], SessionController);
let CapabilityController = class CapabilityController {
    constructor(requestCap, decideCap) {
        this.requestCap = requestCap;
        this.decideCap = decideCap;
    }
    async requestCapability(user, dto) {
        const result = await this.requestCap.execute({
            userId: user.userId,
            type: dto.type,
        });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
    async decideCapability(id, dto, admin) {
        const validDecisions = ['approve', 'reject', 'suspend', 'reactivate', 'revoke'];
        if (!validDecisions.includes(dto.decision)) {
            throw new app_error_1.ForbiddenError(`Invalid decision: ${dto.decision}`);
        }
        const result = await this.decideCap.execute({
            capabilityId: id,
            decision: dto.decision,
            adminId: admin.userId,
            reason: dto.reason,
        });
        if (result.isFail)
            throw result.error;
        return result.value;
    }
};
exports.CapabilityController = CapabilityController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Request a new capability' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, identity_dto_1.RequestCapabilityDto]),
    __metadata("design:returntype", Promise)
], CapabilityController.prototype, "requestCapability", null);
__decorate([
    (0, common_1.Post)(':id/decide'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: approve or reject capability request' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, identity_dto_1.DecideCapabilityDto, Object]),
    __metadata("design:returntype", Promise)
], CapabilityController.prototype, "decideCapability", null);
exports.CapabilityController = CapabilityController = __decorate([
    (0, swagger_1.ApiTags)('Capabilities'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('capabilities'),
    __metadata("design:paramtypes", [identity_use_cases_1.RequestCapabilityUseCase,
        identity_use_cases_1.DecideCapabilityUseCase])
], CapabilityController);
//# sourceMappingURL=identity.controllers.js.map