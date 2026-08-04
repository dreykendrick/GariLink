"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = void 0;
class Entity {
    constructor(id, createdAt = new Date(), updatedAt = new Date()) {
        this.id = id;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    equals(other) {
        if (!(other instanceof Entity))
            return false;
        return this.id === other.id;
    }
    touch() {
        this.updatedAt = new Date();
    }
}
exports.Entity = Entity;
//# sourceMappingURL=entity.base.js.map