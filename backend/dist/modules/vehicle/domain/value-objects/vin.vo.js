"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vin = void 0;
const value_object_base_1 = require("../../../../shared/domain/value-object.base");
const app_error_1 = require("../../../../core/errors/app-error");
class Vin extends value_object_base_1.ValueObject {
    validate() {
        const { value } = this.props;
        if (!value) {
            throw new app_error_1.ValidationError('VIN cannot be empty');
        }
        if (value.length !== 17) {
            throw new app_error_1.ValidationError('VIN must be exactly 17 characters long');
        }
    }
    get value() {
        return this.props.value;
    }
}
exports.Vin = Vin;
//# sourceMappingURL=vin.vo.js.map