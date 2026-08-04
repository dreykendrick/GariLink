"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshToken = void 0;
const openapi = require("@nestjs/swagger");
const entity_base_1 = require("../../../../shared/domain/entity.base");
class RefreshToken extends entity_base_1.Entity {
    constructor(id, token, userId, sessionId, familyId, isRevoked, expiresAt, replacedByTokenId, createdAt) {
        super(id, createdAt, createdAt);
        this.token = token;
        this.userId = userId;
        this.sessionId = sessionId;
        this.familyId = familyId;
        this.isRevoked = isRevoked;
        this.expiresAt = expiresAt;
        this.replacedByTokenId = replacedByTokenId;
    }
    revoke() {
        this.isRevoked = true;
    }
    isExpired() {
        return this.expiresAt < new Date();
    }
    replace(newTokenId) {
        this.isRevoked = true;
        this.replacedByTokenId = newTokenId;
    }
    static create(params) {
        return new RefreshToken(params.id, params.token, params.userId, params.sessionId, params.familyId, false, params.expiresAt, null);
    }
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.RefreshToken = RefreshToken;
//# sourceMappingURL=refresh-token.entity.js.map