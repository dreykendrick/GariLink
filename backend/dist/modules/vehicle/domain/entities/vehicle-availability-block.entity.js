"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleAvailabilityBlock = void 0;
const openapi = require("@nestjs/swagger");
const entity_base_1 = require("../../../../shared/domain/entity.base");
class VehicleAvailabilityBlock extends entity_base_1.Entity {
    constructor(id, props, createdAt, updatedAt) {
        super(id, createdAt, updatedAt);
        this._props = { ...props };
    }
    get vehicleId() { return this._props.vehicleId; }
    get startDate() { return this._props.startDate; }
    get endDate() { return this._props.endDate; }
    get type() { return this._props.type; }
    get reason() { return this._props.reason; }
    get props() {
        return { ...this._props };
    }
    static create(id, props) {
        return new VehicleAvailabilityBlock(id, props);
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { _props: { required: true, type: () => Object } };
    }
}
exports.VehicleAvailabilityBlock = VehicleAvailabilityBlock;
//# sourceMappingURL=vehicle-availability-block.entity.js.map