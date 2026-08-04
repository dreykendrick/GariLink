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
    isPhoneVerified?: boolean;
    hasEmail?: boolean;
}
export declare class Profile extends Entity<string> {
    readonly userId: string;
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
    constructor(id: string, userId: string, firstName: string | null, lastName: string | null, middleName: string | null, displayName: string | null, dateOfBirth: Date | null, gender: Gender | null, bio: string | null, photoUrl: string | null, county: string | null, city: string | null, country: string, timezone: string, language: string, completionPercentage: number, notificationPreferences: Record<string, unknown> | null, createdAt?: Date, updatedAt?: Date);
    calculateCompletionPercentage(isPhoneVerified: boolean, hasEmail: boolean): number;
    refreshCompletion(isPhoneVerified: boolean, hasEmail: boolean): void;
    update(fields: Partial<Omit<ProfileProps, 'userId' | 'completionPercentage'>>): void;
    static create(id: string, userId: string): Profile;
}
