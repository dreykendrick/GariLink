"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineCapacity = void 0;
const value_object_base_1 = require("../../../../shared/domain/value-object.base");
const app_error_1 = require("../../../../core/errors/app-error");
class EngineCapacity extends value_object_base_1.ValueObject {
    validate() {
        const { value } = this.props;
        if (value === null || value === undefined) {
            throw new app_error_1.ValidationError('Engine capacity must be provided');
        }
        if (value <= 0) {
            throw new app_error_1.ValidationError('Engine capacity must be greater than 0');
        }
    }
    get value() {
        return this.props.value;
    }
}
exports.EngineCapacity = EngineCapacity;
//# sourceMappingURL=engine-capacity.vo.js.map