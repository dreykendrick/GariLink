"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profile = void 0;
const openapi = require("@nestjs/swagger");
const entity_base_1 = require("../../../../shared/domain/entity.base");
class Profile extends entity_base_1.Entity {
    constructor(id, userId, firstName, lastName, middleName, displayName, dateOfBirth, gender, bio, photoUrl, county, city, country, timezone, language, completionPercentage, notificationPreferences, createdAt, updatedAt) {
        super(id, createdAt, updatedAt);
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.middleName = middleName;
        this.displayName = displayName;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.bio = bio;
        this.photoUrl = photoUrl;
        this.county = county;
        this.city = city;
        this.country = country;
        this.timezone = timezone;
        this.language = language;
        this.completionPercentage = completionPercentage;
        this.notificationPreferences = notificationPreferences;
    }
    calculateCompletionPercentage(isPhoneVerified, hasEmail) {
        let score = 0;
        if (this.firstName && this.lastName)
            score += 20;
        if (isPhoneVerified)
            score += 20;
        if (this.photoUrl)
            score += 15;
        if (this.county && this.city)
            score += 15;
        if (this.dateOfBirth)
            score += 10;
        if (this.bio)
            score += 10;
        if (this.gender)
            score += 5;
        if (hasEmail)
            score += 5;
        return Math.min(100, score);
    }
    refreshCompletion(isPhoneVerified, hasEmail) {
        this.completionPercentage = this.calculateCompletionPercentage(isPhoneVerified, hasEmail);
        this.touch();
    }
    update(fields) {
        if (fields.firstName !== undefined)
            this.firstName = fields.firstName;
        if (fields.lastName !== undefined)
            this.lastName = fields.lastName;
        if (fields.middleName !== undefined)
            this.middleName = fields.middleName;
        if (fields.displayName !== undefined)
            this.displayName = fields.displayName;
        if (fields.dateOfBirth !== undefined)
            this.dateOfBirth = fields.dateOfBirth;
        if (fields.gender !== undefined)
            this.gender = fields.gender;
        if (fields.bio !== undefined)
            this.bio = fields.bio;
        if (fields.photoUrl !== undefined)
            this.photoUrl = fields.photoUrl;
        if (fields.county !== undefined)
            this.county = fields.county;
        if (fields.city !== undefined)
            this.city = fields.city;
        if (fields.country !== undefined)
            this.country = fields.country;
        if (fields.timezone !== undefined)
            this.timezone = fields.timezone;
        if (fields.language !== undefined)
            this.language = fields.language;
        if (fields.notificationPreferences !== undefined) {
            this.notificationPreferences = fields.notificationPreferences;
        }
        this.touch();
    }
    static create(id, userId) {
        return new Profile(id, userId, null, null, null, null, null, null, null, null, null, null, 'KE', 'Africa/Nairobi', 'en', 0, null);
    }
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.Profile = Profile;
//# sourceMappingURL=profile.entity.js.map