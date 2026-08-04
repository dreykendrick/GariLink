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
exports.PrismaRefreshTokenRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../shared/infrastructure/prisma.service");
const refresh_token_entity_1 = require("../../domain/entities/refresh-token.entity");
let PrismaRefreshTokenRepository = class PrismaRefreshTokenRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    toDomain(t) {
        return new refresh_token_entity_1.RefreshToken(t.id, t.token, t.userId, t.sessionId, t.familyId, t.isRevoked, t.expiresAt, t.replacedByTokenId, t.createdAt);
    }
    async findById(id) {
        const r = await this.prisma.refreshToken.findUnique({ where: { id } });
        return r ? this.toDomain(r) : null;
    }
    async findByToken(token) {
        const r = await this.prisma.refreshToken.findUnique({ where: { token } });
        return r ? this.toDomain(r) : null;
    }
    async save(token) {
        await this.prisma.refreshToken.upsert({
            where: { id: token.id },
            create: {
                id: token.id,
                token: token.token,
                userId: token.userId,
                sessionId: token.sessionId,
                familyId: token.familyId,
                isRevoked: token.isRevoked,
                expiresAt: token.expiresAt,
                replacedByTokenId: token.replacedByTokenId,
            },
            update: {
                isRevoked: token.isRevoked,
                replacedByTokenId: token.replacedByTokenId,
            },
        });
    }
    async delete(id) {
        await this.prisma.refreshToken.update({
            where: { id },
            data: { isRevoked: true },
        });
    }
    async revokeFamily(familyId) {
        await this.prisma.refreshToken.updateMany({
            where: { familyId },
            data: { isRevoked: true },
        });
    }
    async revokeAllBySessionId(sessionId) {
        await this.prisma.refreshToken.updateMany({
            where: { sessionId },
            data: { isRevoked: true },
        });
    }
    async revokeAllByUserId(userId) {
        await this.prisma.refreshToken.updateMany({
            where: { userId },
            data: { isRevoked: true },
        });
    }
};
exports.PrismaRefreshTokenRepository = PrismaRefreshTokenRepository;
exports.PrismaRefreshTokenRepository = PrismaRefreshTokenRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaRefreshTokenRepository);
//# sourceMappingURL=prisma-refresh-token.repository.js.map