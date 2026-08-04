"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyRate = void 0;
const value_object_base_1 = require("../../../../shared/domain/value-object.base");
class DailyRate extends value_object_base_1.ValueObject {
    validate() {
        if (this.props.amount < 0) {
            throw new Error('Daily rate amount cannot be negative');
        }
    }
    get amount() {
        return this.props.amount;
    }
    get currency() {
        return this.props.currency;
    }
}
exports.DailyRate = DailyRate;
//# sourceMappingURL=daily-rate.vo.js.map