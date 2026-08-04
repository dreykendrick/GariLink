"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Otp = void 0;
const openapi = require("@nestjs/swagger");
const entity_base_1 = require("../../../../shared/domain/entity.base");
class Otp extends entity_base_1.Entity {
    constructor(id, phoneNumber, userId, purpose, codeHash, expiresAt, isVerified, attempts, lastSentAt, createdAt) {
        super(id, createdAt, createdAt);
        this.phoneNumber = phoneNumber;
        this.userId = userId;
        this.purpose = purpose;
        this.codeHash = codeHash;
        this.expiresAt = expiresAt;
        this.isVerified = isVerified;
        this.attempts = attempts;
        this.lastSentAt = lastSentAt;
    }
    isExpired() {
        return this.expiresAt < new Date();
    }
    isOnCooldown(cooldownSeconds) {
        const cooldownMs = cooldownSeconds * 1000;
        return Date.now() - this.lastSentAt.getTime() < cooldownMs;
    }
    incrementAttempts() {
        this.attempts += 1;
    }
    maxAttemptsReached(max) {
        return this.attempts >= max;
    }
    markVerified() {
        this.isVerified = true;
    }
    static generate(id, phoneNumber, userId, purpose, codeHash, expiryMinutes) {
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
        return new Otp(id, phoneNumber, userId, purpose, codeHash, expiresAt, false, 0, new Date());
    }
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.Otp = Otp;
//# sourceMappingURL=otp.entity.js.map