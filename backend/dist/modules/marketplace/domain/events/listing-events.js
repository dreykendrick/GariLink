"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingDeleted = exports.ListingUpdated = exports.ListingRestored = exports.ListingArchived = exports.ListingPaused = exports.ListingPublished = void 0;
const domain_event_base_1 = require("../../../../shared/domain/domain-event.base");
class ListingPublished extends domain_event_base_1.DomainEvent {
    constructor(aggregateId) {
        super(aggregateId);
        this.aggregateId = aggregateId;
    }
    get eventName() { return 'ListingPublished'; }
}
exports.ListingPublished = ListingPublished;
class ListingPaused extends domain_event_base_1.DomainEvent {
    constructor(aggregateId) {
        super(aggregateId);
        this.aggregateId = aggregateId;
    }
    get eventName() { return 'ListingPaused'; }
}
exports.ListingPaused = ListingPaused;
class ListingArchived extends domain_event_base_1.DomainEvent {
    constructor(aggregateId) {
        super(aggregateId);
        this.aggregateId = aggregateId;
    }
    get eventName() { return 'ListingArchived'; }
}
exports.ListingArchived = ListingArchived;
class ListingRestored extends domain_event_base_1.DomainEvent {
    constructor(aggregateId) {
        super(aggregateId);
        this.aggregateId = aggregateId;
    }
    get eventName() { return 'ListingRestored'; }
}
exports.ListingRestored = ListingRestored;
class ListingUpdated extends domain_event_base_1.DomainEvent {
    constructor(aggregateId, updatedFields) {
        super(aggregateId);
        this.aggregateId = aggregateId;
        this.updatedFields = updatedFields;
    }
    get eventName() { return 'ListingUpdated'; }
}
exports.ListingUpdated = ListingUpdated;
class ListingDeleted extends domain_event_base_1.DomainEvent {
    constructor(aggregateId) {
        super(aggregateId);
        this.aggregateId = aggregateId;
    }
    get eventName() { return 'ListingDeleted'; }
}
exports.ListingDeleted = ListingDeleted;
//# sourceMappingURL=listing-events.js.map