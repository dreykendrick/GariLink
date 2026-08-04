"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalStartedEvent = void 0;
const domain_event_base_1 = require("../../../../shared/domain/domain-event.base");
class RentalStartedEvent extends domain_event_base_1.DomainEvent {
    constructor(aggregateId) {
        super(aggregateId);
    }
    get eventName() { return 'RentalStartedEvent'; }
}
exports.RentalStartedEvent = RentalStartedEvent;
//# sourceMappingURL=rental-started.event.js.map