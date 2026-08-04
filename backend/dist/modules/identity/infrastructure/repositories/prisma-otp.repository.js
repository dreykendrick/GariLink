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
exports.PrismaOtpRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma.service");
const otp_entity_1 = require("../../domain/entities/otp.entity");
let PrismaOtpRepository = class PrismaOtpRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    toDomain(o) {
        return new otp_entity_1.Otp(o.id, o.phoneNumber, o.userId, o.purpose, o.codeHash, o.expiresAt, o.isVerified, o.attempts, o.lastSentAt, o.createdAt);
    }
    async findById(id) {
        const r = await this.prisma.otp.findUnique({ where: { id } });
        return r ? this.toDomain(r) : null;
    }
    async findLatestByPhoneAndPurpose(phoneNumber, purpose) {
        const r = await this.prisma.otp.findFirst({
            where: { phoneNumber, purpose },
            orderBy: { createdAt: 'desc' },
        });
        return r ? this.toDomain(r) : null;
    }
    async findLatestByUserAndPurpose(userId, purpose) {
        const r = await this.prisma.otp.findFirst({
            where: { userId, purpose },
            orderBy: { createdAt: 'desc' },
        });
        return r ? this.toDomain(r) : null;
    }
    async save(otp) {
        await this.prisma.otp.upsert({
            where: { id: otp.id },
            create: {
                id: otp.id,
                phoneNumber: otp.phoneNumber,
                userId: otp.userId,
                purpose: otp.purpose,
                codeHash: otp.codeHash,
                expiresAt: otp.expiresAt,
                isVerified: otp.isVerified,
                attempts: otp.attempts,
                lastSentAt: otp.lastSentAt,
            },
            update: {
                isVerified: otp.isVerified,
                attempts: otp.attempts,
            },
        });
    }
    async delete(id) {
        await this.prisma.otp.delete({ where: { id } });
    }
    async invalidateAllByPhoneAndPurpose(phoneNumber, purpose) {
        await this.prisma.otp.updateMany({
            where: { phoneNumber, purpose, isVerified: false },
            data: { isVerified: true },
        });
    }
};
exports.PrismaOtpRepository = PrismaOtpRepository;
exports.PrismaOtpRepository = PrismaOtpRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaOtpRepository);
//# sourceMappingURL=prisma-otp.repository.js.map