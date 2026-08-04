"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleYear = void 0;
const value_object_base_1 = require("../../../../shared/domain/value-object.base");
const app_error_1 = require("../../../../core/errors/app-error");
class VehicleYear extends value_object_base_1.ValueObject {
    validate() {
        const { value } = this.props;
        if (value === null || value === undefined) {
            throw new app_error_1.ValidationError('Vehicle year must be provided');
        }
        const nextYear = new Date().getFullYear() + 1;
        if (value < 1900 || value > nextYear) {
            throw new app_error_1.ValidationError(`Vehicle year must be between 1900 and ${nextYear}`);
        }
    }
    get value() {
        return this.props.value;
    }
}
exports.VehicleYear = VehicleYear;
//# sourceMappingURL=vehicle-year.vo.js.map