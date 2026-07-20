import { Entity } from '../../../../shared/domain/entity.base';
import { Gender } from '@prisma/client';

export interface ProfileProps {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  middleName: string | null;
  displayName: string | null;
  dateOfBirth: Date | null;
  gender: Gender | null;
  bio: string | null;
  photoUrl: string | null;
  county: string | null;
  city: string | null;
  country: string;
  timezone: string;
  language: string;
  completionPercentage: number;
  notificationPreferences: Record<string, unknown> | null;
  // Injected from User for completion calculation
  isPhoneVerified?: boolean;
  hasEmail?: boolean;
}

export class Profile extends Entity<string> {
  constructor(
    id: string,
    public readonly userId: string,
    public firstName: string | null,
    public lastName: string | null,
    public middleName: string | null,
    public displayName: string | null,
    public dateOfBirth: Date | null,
    public gender: Gender | null,
    public bio: string | null,
    public photoUrl: string | null,
    public county: string | null,
    public city: string | null,
    public country: string,
    public timezone: string,
    public language: string,
    public completionPercentage: number,
    public notificationPreferences: Record<string, unknown> | null,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
  }

  // ─── Completion scoring ───────────────────────────────────────────────
  // Max = 100. Breakdown:
  //   firstName + lastName = 20
  //   phone verified       = 20
  //   photoUrl             = 15
  //   county + city        = 15
  //   dateOfBirth          = 10
  //   bio                  = 10
  //   gender               =  5
  //   email                =  5

  calculateCompletionPercentage(
    isPhoneVerified: boolean,
    hasEmail: boolean,
  ): number {
    let score = 0;
    if (this.firstName && this.lastName) score += 20;
    if (isPhoneVerified) score += 20;
    if (this.photoUrl) score += 15;
    if (this.county && this.city) score += 15;
    if (this.dateOfBirth) score += 10;
    if (this.bio) score += 10;
    if (this.gender) score += 5;
    if (hasEmail) score += 5;
    return Math.min(100, score);
  }

  refreshCompletion(isPhoneVerified: boolean, hasEmail: boolean): void {
    this.completionPercentage = this.calculateCompletionPercentage(
      isPhoneVerified,
      hasEmail,
    );
    this.touch();
  }

  update(fields: Partial<Omit<ProfileProps, 'userId' | 'completionPercentage'>>): void {
    if (fields.firstName !== undefined) this.firstName = fields.firstName;
    if (fields.lastName !== undefined) this.lastName = fields.lastName;
    if (fields.middleName !== undefined) this.middleName = fields.middleName;
    if (fields.displayName !== undefined) this.displayName = fields.displayName;
    if (fields.dateOfBirth !== undefined) this.dateOfBirth = fields.dateOfBirth;
    if (fields.gender !== undefined) this.gender = fields.gender;
    if (fields.bio !== undefined) this.bio = fields.bio;
    if (fields.photoUrl !== undefined) this.photoUrl = fields.photoUrl;
    if (fields.county !== undefined) this.county = fields.county;
    if (fields.city !== undefined) this.city = fields.city;
    if (fields.country !== undefined) this.country = fields.country;
    if (fields.timezone !== undefined) this.timezone = fields.timezone;
    if (fields.language !== undefined) this.language = fields.language;
    if (fields.notificationPreferences !== undefined) {
      this.notificationPreferences = fields.notificationPreferences;
    }
    this.touch();
  }

  static create(id: string, userId: string): Profile {
    return new Profile(
      id, userId, null, null, null, null, null, null, null, null,
      null, null, 'KE', 'Africa/Nairobi', 'en', 0, null,
    );
  }
}
