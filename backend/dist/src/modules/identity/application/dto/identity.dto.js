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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecideCapabilityDto = exports.RequestCapabilityDto = exports.CompleteProfileDto = exports.ResetPasswordDto = exports.ForgotPasswordDto = exports.VerifyOtpDto = exports.RequestOtpDto = exports.RefreshTokenDto = exports.LoginDto = exports.RegisterUserDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RegisterUserDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { phoneNumber: { required: true, type: () => String, pattern: "/^\\+[1-9]\\d{6,14}$/" }, password: { required: true, type: () => String, minLength: 8, pattern: "/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$/" }, firstName: { required: false, type: () => String }, lastName: { required: false, type: () => String } };
    }
}
exports.RegisterUserDto = RegisterUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+254712345678' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^\+[1-9]\d{6,14}$/, {
        message: 'Phone number must be in E.164 format (e.g. +254712345678)',
    }),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SecurePass1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
        message: 'Password must be at least 8 characters with uppercase, lowercase, and a digit',
    }),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'John' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Doe' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "lastName", void 0);
class LoginDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { identifier: { required: true, type: () => String }, password: { required: true, type: () => String }, deviceId: { required: false, type: () => String }, deviceName: { required: false, type: () => String } };
    }
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+254712345678', description: 'Phone number or email' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginDto.prototype, "identifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SecurePass1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "deviceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "deviceName", void 0);
class RefreshTokenDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { refreshToken: { required: true, type: () => String } };
    }
}
exports.RefreshTokenDto = RefreshTokenDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RefreshTokenDto.prototype, "refreshToken", void 0);
class RequestOtpDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { phoneNumber: { required: true, type: () => String, pattern: "/^\\+[1-9]\\d{6,14}$/" }, purpose: { required: true, type: () => String } };
    }
}
exports.RequestOtpDto = RequestOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+254712345678' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\+[1-9]\d{6,14}$/),
    __metadata("design:type", String)
], RequestOtpDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['PHONE_VERIFICATION', 'PASSWORD_RESET', 'LOGIN_2FA'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestOtpDto.prototype, "purpose", void 0);
class VerifyOtpDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { phoneNumber: { required: true, type: () => String }, purpose: { required: true, type: () => String }, code: { required: true, type: () => String, minLength: 6 } };
    }
}
exports.VerifyOtpDto = VerifyOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+254712345678' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "purpose", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "code", void 0);
class ForgotPasswordDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { phoneNumber: { required: true, type: () => String, pattern: "/^\\+[1-9]\\d{6,14}$/" } };
    }
}
exports.ForgotPasswordDto = ForgotPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+254712345678' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\+[1-9]\d{6,14}$/),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "phoneNumber", void 0);
class ResetPasswordDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { phoneNumber: { required: true, type: () => String }, otpCode: { required: true, type: () => String }, newPassword: { required: true, type: () => String, minLength: 8, pattern: "/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$/" } };
    }
}
exports.ResetPasswordDto = ResetPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+254712345678' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "otpCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'NewSecurePass1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
        message: 'Password must contain uppercase, lowercase, and a digit',
    }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "newPassword", void 0);
class CompleteProfileDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { firstName: { required: false, type: () => String }, lastName: { required: false, type: () => String }, middleName: { required: false, type: () => String }, displayName: { required: false, type: () => String }, dateOfBirth: { required: false, type: () => String }, gender: { required: false, type: () => String }, bio: { required: false, type: () => String }, county: { required: false, type: () => String }, city: { required: false, type: () => String }, country: { required: false, type: () => String }, timezone: { required: false, type: () => String }, language: { required: false, type: () => String } };
    }
}
exports.CompleteProfileDto = CompleteProfileDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteProfileDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteProfileDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteProfileDto.prototype, "middleName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteProfileDto.prototype, "displayName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteProfileDto.prototype, "dateOfBirth", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteProfileDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteProfileDto.prototype, "bio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteProfileDto.prototype, "county", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteProfileDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteProfileDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteProfileDto.prototype, "timezone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteProfileDto.prototype, "language", void 0);
class RequestCapabilityDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: true, type: () => String } };
    }
}
exports.RequestCapabilityDto = RequestCapabilityDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RequestCapabilityDto.prototype, "type", void 0);
class DecideCapabilityDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { decision: { required: true, type: () => String }, reason: { required: false, type: () => String } };
    }
}
exports.DecideCapabilityDto = DecideCapabilityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['approve', 'reject', 'suspend', 'reactivate', 'revoke'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DecideCapabilityDto.prototype, "decision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DecideCapabilityDto.prototype, "reason", void 0);
//# sourceMappingURL=identity.dto.js.map