"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalApprovedEvent = void 0;
const domain_event_base_1 = require("../../../../shared/domain/domain-event.base");
class RentalApprovedEvent extends domain_event_base_1.DomainEvent {
    constructor(aggregateId) {
        super(aggregateId);
    }
    get eventName() { return 'RentalApprovedEvent'; }
}
exports.RentalApprovedEvent = RentalApprovedEvent;
//# sourceMappingURL=rental-approved.event.js.map