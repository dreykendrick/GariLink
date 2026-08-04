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
exports.PrismaSessionRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma.service");
const session_entity_1 = require("../../domain/entities/session.entity");
let PrismaSessionRepository = class PrismaSessionRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    toDomain(s) {
        return new session_entity_1.Session(s.id, s.userId, s.deviceId, s.deviceName, s.ipAddress, s.userAgent, s.isActive, s.revokedAt, s.lastActiveAt, s.createdAt, s.createdAt);
    }
    async findById(id) {
        const r = await this.prisma.session.findUnique({ where: { id } });
        return r ? this.toDomain(r) : null;
    }
    async findAllActiveByUserId(userId) {
        const records = await this.prisma.session.findMany({
            where: { userId, isActive: true },
            orderBy: { lastActiveAt: 'desc' },
        });
        return records.map((r) => this.toDomain(r));
    }
    async save(session) {
        await this.prisma.session.upsert({
            where: { id: session.id },
            create: {
                id: session.id,
                userId: session.userId,
                deviceId: session.deviceId,
                deviceName: session.deviceName,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                isActive: session.isActive,
                revokedAt: session.revokedAt,
                lastActiveAt: session.lastActiveAt,
            },
            update: {
                isActive: session.isActive,
                revokedAt: session.revokedAt,
                lastActiveAt: session.lastActiveAt,
            },
        });
    }
    async delete(id) {
        await this.prisma.session.update({
            where: { id },
            data: { isActive: false, revokedAt: new Date() },
        });
    }
    async revokeAllByUserId(userId) {
        await this.prisma.session.updateMany({
            where: { userId, isActive: true },
            data: { isActive: false, revokedAt: new Date() },
        });
    }
};
exports.PrismaSessionRepository = PrismaSessionRepository;
exports.PrismaSessionRepository = PrismaSessionRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSessionRepository);
//# sourceMappingURL=prisma-session.repository.js.map