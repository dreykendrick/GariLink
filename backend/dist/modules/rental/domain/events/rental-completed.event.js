"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalCompletedEvent = void 0;
const domain_event_base_1 = require("../../../../shared/domain/domain-event.base");
class RentalCompletedEvent extends domain_event_base_1.DomainEvent {
    constructor(aggregateId) {
        super(aggregateId);
    }
    get eventName() { return 'RentalCompletedEvent'; }
}
exports.RentalCompletedEvent = RentalCompletedEvent;
//# sourceMappingURL=rental-completed.event.js.map