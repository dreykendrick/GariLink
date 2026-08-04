"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMapper = void 0;
const user_entity_1 = require("../../domain/entities/user.entity");
const email_vo_1 = require("../../domain/value-objects/email.vo");
const phone_number_vo_1 = require("../../domain/value-objects/phone-number.vo");
class UserMapper {
    static toDomain(prisma) {
        return new user_entity_1.User(prisma.id, {
            email: prisma.email ? email_vo_1.Email.create(prisma.email) : null,
            phoneNumber: phone_number_vo_1.PhoneNumber.create(prisma.phoneNumber),
            passwordHash: prisma.passwordHash,
            roles: prisma.roles?.map((r) => r.role) ?? [],
            isEmailVerified: prisma.isEmailVerified,
            isPhoneVerified: prisma.isPhoneVerified,
            isActive: prisma.isActive,
            lastLoginAt: prisma.lastLoginAt,
            failedLoginAttempts: prisma.failedLoginAttempts,
            lockedUntil: prisma.lockedUntil,
        }, prisma.createdAt, prisma.updatedAt);
    }
    static toPrismaCreate(user) {
        return {
            id: user.id,
            email: user.email?.value ?? null,
            phoneNumber: user.phoneNumber.value,
            passwordHash: user.passwordHash,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
            failedLoginAttempts: user.failedLoginAttempts,
            lockedUntil: user.lockedUntil,
        };
    }
    static toPrismaUpdate(user) {
        return {
            email: user.email?.value ?? null,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
            failedLoginAttempts: user.failedLoginAttempts,
            lockedUntil: user.lockedUntil,
            updatedAt: user.updatedAt,
        };
    }
}
exports.UserMapper = UserMapper;
//# sourceMappingURL=user.mapper.js.map