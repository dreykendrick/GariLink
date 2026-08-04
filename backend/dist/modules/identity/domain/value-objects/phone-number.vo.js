"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneNumber = void 0;
const value_object_base_1 = require("../../../../shared/domain/value-object.base");
const app_error_1 = require("../../../../core/errors/app-error");
class PhoneNumber extends value_object_base_1.ValueObject {
    validate() {
        if (!PhoneNumber.E164_REGEX.test(this.props.value)) {
            throw new app_error_1.ValidationError(`"${this.props.value}" is not a valid phone number. Use E.164 format (e.g. +254712345678)`);
        }
    }
    get value() { return this.props.value; }
    static create(phone) {
        return new PhoneNumber({ value: phone.trim() });
    }
}
exports.PhoneNumber = PhoneNumber;
PhoneNumber.E164_REGEX = /^\+[1-9]\d{6,14}$/;
//# sourceMappingURL=phone-number.vo.js.map