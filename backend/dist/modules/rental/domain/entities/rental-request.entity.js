"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalRequest = void 0;
const openapi = require("@nestjs/swagger");
const aggregate_root_base_1 = require("../../../../shared/domain/aggregate-root.base");
const client_1 = require("@prisma/client");
const rental_approved_event_1 = require("../events/rental-approved.event");
const rental_rejected_event_1 = require("../events/rental-rejected.event");
const rental_cancelled_event_1 = require("../events/rental-cancelled.event");
const rental_ready_event_1 = require("../events/rental-ready.event");
const rental_started_event_1 = require("../events/rental-started.event");
const rental_completed_event_1 = require("../events/rental-completed.event");
const rental_errors_1 = require("../errors/rental.errors");
class RentalRequest extends aggregate_root_base_1.AggregateRoot {
    constructor(id, props, createdAt, updatedAt) {
        super(id, createdAt, updatedAt);
        this._status = props.status;
        this._props = props;
    }
    get status() { return this._status; }
    get customerId() { return this._props.customerId; }
    get workspaceId() { return this._props.workspaceId; }
    get vehicleId() { return this._props.vehicleId; }
    get listingId() { return this._props.listingId; }
    get startDate() { return this._props.startDate; }
    get endDate() { return this._props.endDate; }
    approve(reason) {
        if (this._status !== client_1.RentalStatus.REQUESTED && this._status !== client_1.RentalStatus.UNDER_REVIEW) {
            throw new rental_errors_1.InvalidRentalTransitionError();
        }
        this._status = client_1.RentalStatus.APPROVED;
        this.touch();
        this.addDomainEvent(new rental_approved_event_1.RentalApprovedEvent(this.id));
    }
    reject(reason) {
        if (this._status !== client_1.RentalStatus.REQUESTED && this._status !== client_1.RentalStatus.UNDER_REVIEW) {
            throw new rental_errors_1.InvalidRentalTransitionError();
        }
        this._status = client_1.RentalStatus.REJECTED;
        if (reason)
            this._props.rejectionReason = reason;
        this.touch();
        this.addDomainEvent(new rental_rejected_event_1.RentalRejectedEvent(this.id));
    }
    cancel() {
        if (this._status === client_1.RentalStatus.COMPLETED || this._status === client_1.RentalStatus.ACTIVE) {
            throw new rental_errors_1.InvalidRentalTransitionError();
        }
        this._status = client_1.RentalStatus.CANCELLED;
        this.touch();
        this.addDomainEvent(new rental_cancelled_event_1.RentalCancelledEvent(this.id));
    }
    markReady() {
        if (this._status !== client_1.RentalStatus.APPROVED) {
            throw new rental_errors_1.InvalidRentalTransitionError();
        }
        this._status = client_1.RentalStatus.READY_FOR_PICKUP;
        this.touch();
        this.addDomainEvent(new rental_ready_event_1.RentalReadyEvent(this.id));
    }
    start() {
        if (this._status !== client_1.RentalStatus.READY_FOR_PICKUP) {
            throw new rental_errors_1.InvalidRentalTransitionError();
        }
        this._status = client_1.RentalStatus.ACTIVE;
        this.touch();
        this.addDomainEvent(new rental_started_event_1.RentalStartedEvent(this.id));
    }
    complete() {
        if (this._status !== client_1.RentalStatus.ACTIVE) {
            throw new rental_errors_1.InvalidRentalTransitionError();
        }
        this._status = client_1.RentalStatus.COMPLETED;
        this.touch();
        this.addDomainEvent(new rental_completed_event_1.RentalCompletedEvent(this.id));
    }
    static create(id, props) {
        return new RentalRequest(id, props);
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { _status: { required: true, type: () => Object }, _props: { required: true, type: () => Object } };
    }
}
exports.RentalRequest = RentalRequest;
//# sourceMappingURL=rental-request.entity.js.map