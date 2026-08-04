"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalConfigVO = void 0;
const value_object_base_1 = require("../../../../shared/domain/value-object.base");
class RentalConfigVO extends value_object_base_1.ValueObject {
    validate() {
        if (this.props.depositAmount < 0) {
            throw new Error('Deposit amount cannot be negative');
        }
        if (this.props.minimumRentalDays < 1) {
            throw new Error('Minimum rental days must be at least 1');
        }
        if (!this.props.pickupCounty) {
            throw new Error('Pickup county is required');
        }
        if (!this.props.pickupCity) {
            throw new Error('Pickup city is required');
        }
    }
    get dailyRate() { return this.props.dailyRate; }
    get depositAmount() { return this.props.depositAmount; }
    get pickupCounty() { return this.props.pickupCounty; }
    get pickupCity() { return this.props.pickupCity; }
    get fuelPolicy() { return this.props.fuelPolicy; }
    get minimumRentalDays() { return this.props.minimumRentalDays; }
}
exports.RentalConfigVO = RentalConfigVO;
//# sourceMappingURL=rental-config.vo.js.map