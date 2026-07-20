import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma.service';
import { IProfileRepository } from '../../domain/repositories/profile.repository.interface';
import { Profile } from '../../domain/entities/profile.entity';
import { Profile as PrismaProfile, Prisma } from '@prisma/client';

@Injectable()
export class PrismaProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(p: PrismaProfile): Profile {
    return new Profile(
      p.id, p.userId, p.firstName, p.lastName, p.middleName, p.displayName,
      p.dateOfBirth, p.gender, p.bio, p.photoUrl, p.county, p.city,
      p.country, p.timezone, p.language, p.completionPercentage,
      p.notificationPreferences as Record<string, unknown> | null,
      p.createdAt, p.updatedAt,
    );
  }

  async findById(id: string): Promise<Profile | null> {
    const r = await this.prisma.profile.findUnique({ where: { id } });
    return r ? this.toDomain(r) : null;
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const r = await this.prisma.profile.findUnique({ where: { userId } });
    return r ? this.toDomain(r) : null;
  }

  async save(profile: Profile): Promise<void> {
    const data: Prisma.ProfileUncheckedCreateInput = {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      middleName: profile.middleName,
      displayName: profile.displayName,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      bio: profile.bio,
      photoUrl: profile.photoUrl,
      county: profile.county,
      city: profile.city,
      country: profile.country,
      timezone: profile.timezone,
      language: profile.language,
      completionPercentage: profile.completionPercentage,
      notificationPreferences: (profile.notificationPreferences as Prisma.InputJsonValue) ?? Prisma.JsonNull,
    };

    await this.prisma.profile.upsert({
      where: { id: profile.id },
      create: data,
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        displayName: data.displayName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        bio: data.bio,
        photoUrl: data.photoUrl,
        county: data.county,
        city: data.city,
        country: data.country,
        timezone: data.timezone,
        language: data.language,
        completionPercentage: data.completionPercentage,
        notificationPreferences: data.notificationPreferences,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.profile.delete({ where: { id } });
  }
}
