"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalStatusHistory = void 0;
const openapi = require("@nestjs/swagger");
const entity_base_1 = require("../../../../shared/domain/entity.base");
class RentalStatusHistory extends entity_base_1.Entity {
    constructor(id, rentalRequestId, status, changedById, reason, createdAt, updatedAt) {
        super(id, createdAt, updatedAt);
        this.rentalRequestId = rentalRequestId;
        this.status = status;
        this.changedById = changedById;
        this.reason = reason;
    }
    static create(params) {
        return new RentalStatusHistory(params.id, params.rentalRequestId, params.status, params.changedById, params.reason ?? null, new Date(), new Date());
    }
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.RentalStatusHistory = RentalStatusHistory;
//# sourceMappingURL=rental-status-history.entity.js.map