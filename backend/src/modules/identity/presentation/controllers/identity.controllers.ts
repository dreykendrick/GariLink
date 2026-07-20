import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { OtpPurpose, CapabilityType } from '@prisma/client';

import { Public } from '../../../../core/security/decorators/public.decorator';
import { CurrentUser } from '../../../../core/security/decorators/current-user.decorator';
import { Roles } from '../../../../core/security/decorators/roles.decorator';
import { AccessJwtPayload } from '../../../../core/security/token.service';

import {
  RegisterUserDto,
  LoginDto,
  RefreshTokenDto,
  RequestOtpDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  CompleteProfileDto,
  RequestCapabilityDto,
  DecideCapabilityDto,
} from '../../application/dto/identity.dto';

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
} from '../../application/use-cases/identity.use-cases';

import { ForbiddenError } from '../../../../core/errors/app-error';

// ─── Auth Controller ──────────────────────────────────────────────────────────

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly register: RegisterUserUseCase,
    private readonly login: AuthenticateUserUseCase,
    private readonly refresh: RefreshTokenUseCase,
    private readonly logout: LogoutUseCase,
    private readonly requestOtp: RequestOtpUseCase,
    private readonly verifyOtp: VerifyOtpUseCase,
    private readonly forgotPassword: ForgotPasswordUseCase,
    private readonly resetPassword: ResetPasswordUseCase,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async registerUser(@Body() dto: RegisterUserDto, @Req() req: Request) {
    const result = await this.register.execute({
      ...dto,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone/email + password' })
  async loginUser(@Body() dto: LoginDto, @Req() req: Request) {
    const result = await this.login.execute({
      ...dto,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const result = await this.refresh.execute(dto);
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current session' })
  async logoutUser(@CurrentUser() user: AccessJwtPayload) {
    const result = await this.logout.execute({
      sessionId: user.sessionId,
      userId: user.userId,
    });
    if (result.isFail) throw result.error;
  }

  @Public()
  @Post('otp/request')
  @ApiOperation({ summary: 'Request an OTP' })
  async otpRequest(@Body() dto: RequestOtpDto) {
    const result = await this.requestOtp.execute({
      phoneNumber: dto.phoneNumber,
      purpose: dto.purpose as OtpPurpose,
    });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Public()
  @Post('otp/resend')
  @ApiOperation({ summary: 'Resend OTP (alias for request)' })
  async otpResend(@Body() dto: RequestOtpDto) {
    const result = await this.requestOtp.execute({
      phoneNumber: dto.phoneNumber,
      purpose: dto.purpose as OtpPurpose,
    });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Public()
  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify an OTP' })
  async otpVerify(@Body() dto: VerifyOtpDto) {
    const result = await this.verifyOtp.execute({
      phoneNumber: dto.phoneNumber,
      purpose: dto.purpose as OtpPurpose,
      code: dto.code,
    });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Public()
  @Post('password/forgot')
  @ApiOperation({ summary: 'Request password reset OTP' })
  async forgotPass(@Body() dto: ForgotPasswordDto) {
    const result = await this.forgotPassword.execute(dto);
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Public()
  @Post('password/reset')
  @ApiOperation({ summary: 'Reset password with OTP' })
  async resetPass(@Body() dto: ResetPasswordDto) {
    const result = await this.resetPassword.execute(dto);
    if (result.isFail) throw result.error;
    return result.value;
  }
}

// ─── Profile Controller ───────────────────────────────────────────────────────

@ApiTags('Profile')
@ApiBearerAuth()
@Controller()
export class ProfileController {
  constructor(
    private readonly getCurrentUser: GetCurrentUserUseCase,
    private readonly completeProfile: CompleteProfileUseCase,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  async getMe(@CurrentUser() user: AccessJwtPayload) {
    const result = await this.getCurrentUser.execute({ userId: user.userId });
    if (result.isFail) throw result.error;
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

  @Post('profile')
  @ApiOperation({ summary: 'Update profile fields' })
  async updateProfile(
    @CurrentUser() user: AccessJwtPayload,
    @Body() dto: CompleteProfileDto,
  ) {
    const result = await this.completeProfile.execute({
      userId: user.userId,
      fields: dto as Record<string, unknown>,
    });
    if (result.isFail) throw result.error;
    return result.value;
  }
}

// ─── Session Controller ───────────────────────────────────────────────────────

@ApiTags('Sessions')
@ApiBearerAuth()
@Controller('sessions')
export class SessionController {
  constructor(
    private readonly listSessions: ListSessionsUseCase,
    private readonly revokeSession: RevokeSessionUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List active sessions' })
  async list(@CurrentUser() user: AccessJwtPayload) {
    const result = await this.listSessions.execute({
      userId: user.userId,
      currentSessionId: user.sessionId,
    });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a session' })
  async revoke(@Param('id') id: string, @CurrentUser() user: AccessJwtPayload) {
    const result = await this.revokeSession.execute({
      sessionId: id,
      userId: user.userId,
    });
    if (result.isFail) throw result.error;
  }
}

// ─── Capability Controller ────────────────────────────────────────────────────

@ApiTags('Capabilities')
@ApiBearerAuth()
@Controller('capabilities')
export class CapabilityController {
  constructor(
    private readonly requestCap: RequestCapabilityUseCase,
    private readonly decideCap: DecideCapabilityUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Request a new capability' })
  async requestCapability(
    @CurrentUser() user: AccessJwtPayload,
    @Body() dto: RequestCapabilityDto,
  ) {
    const result = await this.requestCap.execute({
      userId: user.userId,
      type: dto.type as CapabilityType,
    });
    if (result.isFail) throw result.error;
    return result.value;
  }

  @Post(':id/decide')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Admin: approve or reject capability request' })
  async decideCapability(
    @Param('id') id: string,
    @Body() dto: DecideCapabilityDto,
    @CurrentUser() admin: AccessJwtPayload,
  ) {
    const validDecisions = ['approve', 'reject', 'suspend', 'reactivate', 'revoke'];
    if (!validDecisions.includes(dto.decision as any)) {
      throw new ForbiddenError(`Invalid decision: ${dto.decision}`);
    }
    const result = await this.decideCap.execute({
      capabilityId: id,
      decision: dto.decision as any,
      adminId: admin.userId,
      reason: dto.reason,
    });
    if (result.isFail) throw result.error;
    return result.value;
  }
}
