"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Password = void 0;
const value_object_base_1 = require("../../../../shared/domain/value-object.base");
const app_error_1 = require("../../../../core/errors/app-error");
class Password extends value_object_base_1.ValueObject {
    validate() {
        const { value } = this.props;
        if (value.length < Password.MIN_LENGTH) {
            throw new app_error_1.ValidationError(`Password must be at least ${Password.MIN_LENGTH} characters`);
        }
        if (!Password.UPPERCASE.test(value)) {
            throw new app_error_1.ValidationError('Password must contain at least one uppercase letter');
        }
        if (!Password.LOWERCASE.test(value)) {
            throw new app_error_1.ValidationError('Password must contain at least one lowercase letter');
        }
        if (!Password.DIGIT.test(value)) {
            throw new app_error_1.ValidationError('Password must contain at least one digit');
        }
    }
    get value() { return this.props.value; }
    static create(password) {
        return new Password({ value: password });
    }
}
exports.Password = Password;
Password.MIN_LENGTH = 8;
Password.UPPERCASE = /[A-Z]/;
Password.LOWERCASE = /[a-z]/;
Password.DIGIT = /[0-9]/;
//# sourceMappingURL=password.vo.js.map