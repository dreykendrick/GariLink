"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Seats = void 0;
const value_object_base_1 = require("../../../../shared/domain/value-object.base");
const app_error_1 = require("../../../../core/errors/app-error");
class Seats extends value_object_base_1.ValueObject {
    validate() {
        const { value } = this.props;
        if (value === null || value === undefined) {
            throw new app_error_1.ValidationError('Seats must be provided');
        }
        if (value <= 0) {
            throw new app_error_1.ValidationError('Seats must be greater than 0');
        }
    }
    get value() {
        return this.props.value;
    }
}
exports.Seats = Seats;
//# sourceMappingURL=seats.vo.js.map