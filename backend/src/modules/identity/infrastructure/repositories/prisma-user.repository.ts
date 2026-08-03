import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserMapper } from '../persistence/user.mapper';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = { roles: true };

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: this.include,
    });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: this.include,
    });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findByPhoneNumber(phone: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { phoneNumber: phone },
      include: this.include,
    });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const isEmail = identifier.includes('@');
    if (isEmail) return this.findByEmail(identifier);

    let phone = identifier.trim();
    if (phone.startsWith('0') && phone.length >= 10) {
      phone = '+255' + phone.substring(1);
    } else if (!phone.startsWith('+') && phone.length >= 9) {
      phone = '+' + phone;
    }

    const userByPhone = await this.findByPhoneNumber(phone);
    if (userByPhone) return userByPhone;

    return this.findByPhoneNumber(identifier);
  }

  async save(user: User): Promise<void> {
    const exists = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (!exists) {
      await this.prisma.user.create({
        data: {
          ...UserMapper.toPrismaCreate(user),
          roles: {
            create: user.roles.map((role) => ({ role })),
          },
        },
      });
    } else {
      // Update user fields
      await this.prisma.user.update({
        where: { id: user.id },
        data: UserMapper.toPrismaUpdate(user),
      });

      // Sync roles — delete all, re-create
      await this.prisma.userRoleRecord.deleteMany({ where: { userId: user.id } });
      if (user.roles.length > 0) {
        await this.prisma.userRoleRecord.createMany({
          data: user.roles.map((role) => ({ userId: user.id, role })),
          skipDuplicates: true,
        });
      }
    }
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
