"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
const value_object_base_1 = require("../../../../shared/domain/value-object.base");
const app_error_1 = require("../../../../core/errors/app-error");
class Email extends value_object_base_1.ValueObject {
    validate() {
        if (!Email.EMAIL_REGEX.test(this.props.value)) {
            throw new app_error_1.ValidationError(`"${this.props.value}" is not a valid email address`);
        }
    }
    get value() { return this.props.value; }
    static create(email) {
        return new Email({ value: email.toLowerCase().trim() });
    }
}
exports.Email = Email;
Email.EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//# sourceMappingURL=email.vo.js.map