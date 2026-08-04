"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationNumber = void 0;
const value_object_base_1 = require("../../../../shared/domain/value-object.base");
const app_error_1 = require("../../../../core/errors/app-error");
class RegistrationNumber extends value_object_base_1.ValueObject {
    validate() {
        const { value } = this.props;
        if (!value) {
            throw new app_error_1.ValidationError('Registration number cannot be empty');
        }
        const regex = /^[A-Z0-9 ]+$/;
        if (!regex.test(value)) {
            throw new app_error_1.ValidationError('Registration number must contain only uppercase alphanumeric characters and spaces');
        }
    }
    get value() {
        return this.props.value;
    }
}
exports.RegistrationNumber = RegistrationNumber;
//# sourceMappingURL=registration-number.vo.js.map