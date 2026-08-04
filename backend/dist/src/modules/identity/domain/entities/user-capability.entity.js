"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserCapability = void 0;
const openapi = require("@nestjs/swagger");
const entity_base_1 = require("../../../../shared/domain/entity.base");
const client_1 = require("@prisma/client");
class UserCapability extends entity_base_1.Entity {
    constructor(id, userId, type, status, grantedAt, expiresAt, suspendedAt, suspendedReason, revokedAt, revokedReason, rejectedAt, rejectionReason, requestedAt, createdAt, updatedAt) {
        super(id, createdAt, updatedAt);
        this.userId = userId;
        this.type = type;
        this.status = status;
        this.grantedAt = grantedAt;
        this.expiresAt = expiresAt;
        this.suspendedAt = suspendedAt;
        this.suspendedReason = suspendedReason;
        this.revokedAt = revokedAt;
        this.revokedReason = revokedReason;
        this.rejectedAt = rejectedAt;
        this.rejectionReason = rejectionReason;
        this.requestedAt = requestedAt;
    }
    approve() {
        this.status = client_1.CapabilityStatus.ACTIVE;
        this.grantedAt = new Date();
        this.touch();
    }
    reject(reason) {
        this.status = client_1.CapabilityStatus.REJECTED;
        this.rejectedAt = new Date();
        this.rejectionReason = reason;
        this.touch();
    }
    suspend(reason) {
        this.status = client_1.CapabilityStatus.SUSPENDED;
        this.suspendedAt = new Date();
        this.suspendedReason = reason;
        this.touch();
    }
    reactivate() {
        this.status = client_1.CapabilityStatus.ACTIVE;
        this.suspendedAt = null;
        this.suspendedReason = null;
        this.touch();
    }
    revoke(reason) {
        this.status = client_1.CapabilityStatus.REVOKED;
        this.revokedAt = new Date();
        this.revokedReason = reason;
        this.touch();
    }
    isActive() {
        return this.status === client_1.CapabilityStatus.ACTIVE &&
            (this.expiresAt === null || this.expiresAt > new Date());
    }
    static create(id, userId, type) {
        return new UserCapability(id, userId, type, client_1.CapabilityStatus.PENDING, null, null, null, null, null, null, null, null, new Date());
    }
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UserCapability = UserCapability;
//# sourceMappingURL=user-capability.entity.js.map