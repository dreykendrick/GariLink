"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueObject = void 0;
class ValueObject {
    constructor(props) {
        this.props = Object.freeze(props);
        this.validate();
    }
    equals(other) {
        if (!(other instanceof ValueObject))
            return false;
        return JSON.stringify(this.props) === JSON.stringify(other.props);
    }
}
exports.ValueObject = ValueObject;
//# sourceMappingURL=value-object.base.js.map