import { User as PrismaUser, UserRoleRecord, Prisma } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { PhoneNumber } from '../../domain/value-objects/phone-number.vo';

type PrismaUserWithRoles = PrismaUser & {
  roles?: UserRoleRecord[];
};

export class UserMapper {
  static toDomain(prisma: PrismaUserWithRoles): User {
    return new User(
      prisma.id,
      {
        email: prisma.email ? Email.create(prisma.email) : null,
        phoneNumber: PhoneNumber.create(prisma.phoneNumber),
        passwordHash: prisma.passwordHash,
        roles: prisma.roles?.map((r) => r.role) ?? [],
        isEmailVerified: prisma.isEmailVerified,
        isPhoneVerified: prisma.isPhoneVerified,
        isActive: prisma.isActive,
        lastLoginAt: prisma.lastLoginAt,
        failedLoginAttempts: prisma.failedLoginAttempts,
        lockedUntil: prisma.lockedUntil,
      },
      prisma.createdAt,
      prisma.updatedAt,
    );
  }

  static toPrismaCreate(user: User): Prisma.UserCreateInput {
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

  static toPrismaUpdate(user: User): Prisma.UserUpdateInput {
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
