"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Currency = void 0;
const value_object_base_1 = require("../../../../shared/domain/value-object.base");
class Currency extends value_object_base_1.ValueObject {
    validate() {
        if (!this.props.code || this.props.code.length !== 3) {
            throw new Error('Currency code must be 3 characters long');
        }
    }
    get code() {
        return this.props.code;
    }
}
exports.Currency = Currency;
//# sourceMappingURL=currency.vo.js.map