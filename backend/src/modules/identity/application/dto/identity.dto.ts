import {
  IsString,
  IsOptional,
  MinLength,
  Matches,
  IsNotEmpty,
  IsIn,
  MaxLength,
  IsDateString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterUserDto {
  @ApiProperty({ example: "+254712345678" })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: "Phone number must be in E.164 format (e.g. +254712345678)",
  })
  phoneNumber!: string;

  @ApiProperty({ example: "SecurePass1" })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      "Password must be at least 8 characters with uppercase, lowercase, and a digit",
  })
  password!: string;

  @ApiPropertyOptional({ example: "John" })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: "Doe" })
  @IsOptional()
  @IsString()
  lastName?: string;
}

export class LoginDto {
  @ApiProperty({
    example: "+254712345678",
    description: "Phone number or email",
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({ example: "SecurePass1" })
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
  @ApiProperty({ example: "+254712345678" })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/)
  phoneNumber!: string;

  @ApiProperty({ enum: ["PHONE_VERIFICATION", "PASSWORD_RESET", "LOGIN_2FA"] })
  @IsIn(["PHONE_VERIFICATION", "PASSWORD_RESET", "LOGIN_2FA"])
  purpose!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: "+254712345678" })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/)
  phoneNumber!: string;

  @ApiProperty()
  @IsIn(["PHONE_VERIFICATION", "PASSWORD_RESET", "LOGIN_2FA"])
  purpose!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Matches(/^\d{6}$/, { message: "Verification code must be exactly 6 digits" })
  code!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: "+254712345678" })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/)
  phoneNumber!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: "+254712345678" })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/)
  phoneNumber!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @Matches(/^\d{6}$/, { message: "Verification code must be exactly 6 digits" })
  otpCode!: string;

  @ApiProperty({ example: "NewSecurePass1" })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: "Password must contain uppercase, lowercase, and a digit",
  })
  newPassword!: string;
}

export class CompleteProfileDto {
  @IsOptional() @IsString() @MaxLength(80) firstName?: string;
  @IsOptional() @IsString() @MaxLength(80) lastName?: string;
  @IsOptional() @IsString() @MaxLength(80) middleName?: string;
  @IsOptional() @IsString() @MaxLength(80) displayName?: string;
  @IsOptional() @IsDateString() dateOfBirth?: string;
  @IsOptional()
  @IsIn(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"])
  gender?: string;
  @IsOptional() @IsString() @MaxLength(500) bio?: string;
  @IsOptional() @IsString() @MaxLength(100) county?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
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
  @ApiProperty({
    enum: ["approve", "reject", "suspend", "reactivate", "revoke"],
  })
  @IsString()
  decision!: string;

  @IsOptional() @IsString() reason?: string;
}
