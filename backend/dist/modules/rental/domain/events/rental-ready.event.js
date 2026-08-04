"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalReadyEvent = void 0;
const domain_event_base_1 = require("../../../../shared/domain/domain-event.base");
class RentalReadyEvent extends domain_event_base_1.DomainEvent {
    constructor(aggregateId) {
        super(aggregateId);
    }
    get eventName() { return 'RentalReadyEvent'; }
}
exports.RentalReadyEvent = RentalReadyEvent;
//# sourceMappingURL=rental-ready.event.js.map