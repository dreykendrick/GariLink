"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalRejectedEvent = void 0;
const domain_event_base_1 = require("../../../../shared/domain/domain-event.base");
class RentalRejectedEvent extends domain_event_base_1.DomainEvent {
    constructor(aggregateId) {
        super(aggregateId);
    }
    get eventName() { return 'RentalRejectedEvent'; }
}
exports.RentalRejectedEvent = RentalRejectedEvent;
//# sourceMappingURL=rental-rejected.event.js.map