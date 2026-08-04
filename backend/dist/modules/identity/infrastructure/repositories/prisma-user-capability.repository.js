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
exports.PrismaUserCapabilityRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma.service");
const user_capability_entity_1 = require("../../domain/entities/user-capability.entity");
let PrismaUserCapabilityRepository = class PrismaUserCapabilityRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    toDomain(c) {
        return new user_capability_entity_1.UserCapability(c.id, c.userId, c.type, c.status, c.grantedAt, c.expiresAt, c.suspendedAt, c.suspendedReason, c.revokedAt, c.revokedReason, c.rejectedAt, c.rejectionReason, c.requestedAt, c.createdAt, c.updatedAt);
    }
    async findById(id) {
        const r = await this.prisma.userCapability.findUnique({ where: { id } });
        return r ? this.toDomain(r) : null;
    }
    async findByUserAndType(userId, type) {
        const r = await this.prisma.userCapability.findUnique({
            where: { userId_type: { userId, type } },
        });
        return r ? this.toDomain(r) : null;
    }
    async findAllByUser(userId) {
        const records = await this.prisma.userCapability.findMany({
            where: { userId },
        });
        return records.map((r) => this.toDomain(r));
    }
    async findAllByStatus(status) {
        const records = await this.prisma.userCapability.findMany({
            where: { status },
        });
        return records.map((r) => this.toDomain(r));
    }
    async save(cap) {
        await this.prisma.userCapability.upsert({
            where: { id: cap.id },
            create: {
                id: cap.id,
                userId: cap.userId,
                type: cap.type,
                status: cap.status,
                grantedAt: cap.grantedAt,
                expiresAt: cap.expiresAt,
                suspendedAt: cap.suspendedAt,
                suspendedReason: cap.suspendedReason,
                revokedAt: cap.revokedAt,
                revokedReason: cap.revokedReason,
                rejectedAt: cap.rejectedAt,
                rejectionReason: cap.rejectionReason,
                requestedAt: cap.requestedAt,
            },
            update: {
                status: cap.status,
                grantedAt: cap.grantedAt,
                expiresAt: cap.expiresAt,
                suspendedAt: cap.suspendedAt,
                suspendedReason: cap.suspendedReason,
                revokedAt: cap.revokedAt,
                revokedReason: cap.revokedReason,
                rejectedAt: cap.rejectedAt,
                rejectionReason: cap.rejectionReason,
            },
        });
    }
    async delete(id) {
        await this.prisma.userCapability.delete({ where: { id } });
    }
};
exports.PrismaUserCapabilityRepository = PrismaUserCapabilityRepository;
exports.PrismaUserCapabilityRepository = PrismaUserCapabilityRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaUserCapabilityRepository);
//# sourceMappingURL=prisma-user-capability.repository.js.map