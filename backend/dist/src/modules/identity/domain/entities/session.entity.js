"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const openapi = require("@nestjs/swagger");
const entity_base_1 = require("../../../../shared/domain/entity.base");
class Session extends entity_base_1.Entity {
    constructor(id, userId, deviceId, deviceName, ipAddress, userAgent, isActive, revokedAt, lastActiveAt, createdAt, updatedAt) {
        super(id, createdAt, updatedAt);
        this.userId = userId;
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.isActive = isActive;
        this.revokedAt = revokedAt;
        this.lastActiveAt = lastActiveAt;
    }
    revoke() {
        this.isActive = false;
        this.revokedAt = new Date();
        this.touch();
    }
    updateActivity() {
        this.lastActiveAt = new Date();
        this.touch();
    }
    static create(params) {
        return new Session(params.id, params.userId, params.deviceId ?? null, params.deviceName ?? null, params.ipAddress ?? null, params.userAgent ?? null, true, null, new Date());
    }
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.Session = Session;
//# sourceMappingURL=session.entity.js.map