"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleStatusChangedEvent = exports.VehicleDeletedEvent = exports.VehicleArchivedEvent = exports.VehicleUpdatedEvent = exports.VehicleCreatedEvent = void 0;
const domain_event_base_1 = require("../../../../shared/domain/domain-event.base");
class VehicleCreatedEvent extends domain_event_base_1.DomainEvent {
    constructor(aggregateId, workspaceId) {
        super(aggregateId);
        this.aggregateId = aggregateId;
        this.workspaceId = workspaceId;
    }
    get eventName() {
        return 'VehicleCreatedEvent';
    }
}
exports.VehicleCreatedEvent = VehicleCreatedEvent;
class VehicleUpdatedEvent extends domain_event_base_1.DomainEvent {
    constructor(aggregateId, updatedFields) {
        super(aggregateId);
        this.aggregateId = aggregateId;
        this.updatedFields = updatedFields;
    }
    get eventName() {
        return 'VehicleUpdatedEvent';
    }
}
exports.VehicleUpdatedEvent = VehicleUpdatedEvent;
class VehicleArchivedEvent extends domain_event_base_1.DomainEvent {
    constructor(aggregateId) {
        super(aggregateId);
        this.aggregateId = aggregateId;
    }
    get eventName() {
        return 'VehicleArchivedEvent';
    }
}
exports.VehicleArchivedEvent = VehicleArchivedEvent;
class VehicleDeletedEvent extends domain_event_base_1.DomainEvent {
    constructor(aggregateId) {
        super(aggregateId);
        this.aggregateId = aggregateId;
    }
    get eventName() {
        return 'VehicleDeletedEvent';
    }
}
exports.VehicleDeletedEvent = VehicleDeletedEvent;
class VehicleStatusChangedEvent extends domain_event_base_1.DomainEvent {
    constructor(aggregateId, oldStatus, newStatus) {
        super(aggregateId);
        this.aggregateId = aggregateId;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
    }
    get eventName() {
        return 'VehicleStatusChangedEvent';
    }
}
exports.VehicleStatusChangedEvent = VehicleStatusChangedEvent;
//# sourceMappingURL=vehicle-events.js.map