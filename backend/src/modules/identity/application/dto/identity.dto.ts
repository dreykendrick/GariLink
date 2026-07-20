import {
  IsString,
  IsOptional,
  MinLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ example: '+254712345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'Phone number must be in E.164 format (e.g. +254712345678)',
  })
  phoneNumber!: string;

  @ApiProperty({ example: 'SecurePass1' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'Password must be at least 8 characters with uppercase, lowercase, and a digit',
  })
  password!: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;
}

export class LoginDto {
  @ApiProperty({ example: '+254712345678', description: 'Phone number or email' })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({ example: 'SecurePass1' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class RequestOtpDto {
  @ApiProperty({ example: '+254712345678' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/)
  phoneNumber!: string;

  @ApiProperty({ enum: ['PHONE_VERIFICATION', 'PASSWORD_RESET', 'LOGIN_2FA'] })
  @IsString()
  purpose!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+254712345678' })
  @IsString()
  phoneNumber!: string;

  @ApiProperty()
  @IsString()
  purpose!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  code!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: '+254712345678' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/)
  phoneNumber!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: '+254712345678' })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otpCode!: string;

  @ApiProperty({ example: 'NewSecurePass1' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Password must contain uppercase, lowercase, and a digit',
  })
  newPassword!: string;
}

export class CompleteProfileDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() middleName?: string;
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() dateOfBirth?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() county?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() language?: string;
}

export class RequestCapabilityDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type!: string;
}

export class DecideCapabilityDto {
  @ApiProperty({ enum: ['approve', 'reject', 'suspend', 'reactivate', 'revoke'] })
  @IsString()
  decision!: string;

  @IsOptional() @IsString() reason?: string;
}
