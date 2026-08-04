"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
const entity_base_1 = require("./entity.base");
class AggregateRoot extends entity_base_1.Entity {
    constructor() {
        super(...arguments);
        this._domainEvents = [];
    }
    get domainEvents() {
        return [...this._domainEvents];
    }
    addDomainEvent(event) {
        this._domainEvents.push(event);
    }
    clearDomainEvents() {
        this._domainEvents = [];
    }
}
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=aggregate-root.base.js.map