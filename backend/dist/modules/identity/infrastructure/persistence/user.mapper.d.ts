import { User as PrismaUser, UserRoleRecord, Prisma } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';
type PrismaUserWithRoles = PrismaUser & {
    roles?: UserRoleRecord[];
};
export declare class UserMapper {
    static toDomain(prisma: PrismaUserWithRoles): User;
    static toPrismaCreate(user: User): Prisma.UserCreateInput;
    static toPrismaUpdate(user: User): Prisma.UserUpdateInput;
}
export {};
