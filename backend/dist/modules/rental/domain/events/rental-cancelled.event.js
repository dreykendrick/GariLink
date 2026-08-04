"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalCancelledEvent = void 0;
const domain_event_base_1 = require("../../../../shared/domain/domain-event.base");
class RentalCancelledEvent extends domain_event_base_1.DomainEvent {
    constructor(aggregateId) {
        super(aggregateId);
    }
    get eventName() { return 'RentalCancelledEvent'; }
}
exports.RentalCancelledEvent = RentalCancelledEvent;
//# sourceMappingURL=rental-cancelled.event.js.map