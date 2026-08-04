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
exports.PrismaProfileRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma.service");
const profile_entity_1 = require("../../domain/entities/profile.entity");
const client_1 = require("@prisma/client");
let PrismaProfileRepository = class PrismaProfileRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    toDomain(p) {
        return new profile_entity_1.Profile(p.id, p.userId, p.firstName, p.lastName, p.middleName, p.displayName, p.dateOfBirth, p.gender, p.bio, p.photoUrl, p.county, p.city, p.country, p.timezone, p.language, p.completionPercentage, p.notificationPreferences, p.createdAt, p.updatedAt);
    }
    async findById(id) {
        const r = await this.prisma.profile.findUnique({ where: { id } });
        return r ? this.toDomain(r) : null;
    }
    async findByUserId(userId) {
        const r = await this.prisma.profile.findUnique({ where: { userId } });
        return r ? this.toDomain(r) : null;
    }
    async save(profile) {
        const data = {
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
            notificationPreferences: profile.notificationPreferences ?? client_1.Prisma.JsonNull,
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
    async delete(id) {
        await this.prisma.profile.delete({ where: { id } });
    }
};
exports.PrismaProfileRepository = PrismaProfileRepository;
exports.PrismaProfileRepository = PrismaProfileRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaProfileRepository);
//# sourceMappingURL=prisma-profile.repository.js.map