"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Listing = void 0;
const openapi = require("@nestjs/swagger");
const aggregate_root_base_1 = require("../../../../shared/domain/aggregate-root.base");
const client_1 = require("@prisma/client");
const listing_events_1 = require("../events/listing-events");
class Listing extends aggregate_root_base_1.AggregateRoot {
    constructor(id, props, createdAt, updatedAt) {
        super(id, createdAt, updatedAt);
        this._props = { ...props };
    }
    get vehicleId() { return this._props.vehicleId; }
    get workspaceId() { return this._props.workspaceId; }
    get listerId() { return this._props.listerId; }
    get type() { return this._props.type; }
    get title() { return this._props.title; }
    get description() { return this._props.description; }
    get askingPrice() { return this._props.askingPrice; }
    get currency() { return this._props.currency; }
    get negotiable() { return this._props.negotiable; }
    get status() { return this._props.status; }
    get publishedAt() { return this._props.publishedAt; }
    get isFeatured() { return this._props.isFeatured; }
    get viewCount() { return this._props.viewCount; }
    get conditionRating() { return this._props.conditionRating; }
    get tags() { return [...this._props.tags]; }
    get rentalConfig() { return this._props.rentalConfig; }
    get vehicle() { return this._props.vehicle; }
    get deletedAt() { return this._props.deletedAt; }
    get props() { return { ...this._props }; }
    isDraft() { return this._props.status === client_1.ListingStatus.DRAFT; }
    isActive() { return this._props.status === client_1.ListingStatus.PUBLISHED; }
    publish() {
        if (this._props.status !== client_1.ListingStatus.DRAFT && this._props.status !== client_1.ListingStatus.PAUSED) {
            throw new Error('Only DRAFT or PAUSED listings can be published');
        }
        if (this._props.type === 'FOR_HIRE') {
            if (!this._props.rentalConfig) {
                throw new Error('rentalConfig is required for FOR_HIRE listings');
            }
        }
        if (!this._props.askingPrice || this._props.askingPrice <= 0) {
            throw new Error('Pricing is required to publish a listing');
        }
        if (!this._props.county && (!this._props.rentalConfig || !this._props.rentalConfig.pickupCounty)) {
            throw new Error('Pickup location (county) is required to publish a listing');
        }
        this._props.status = client_1.ListingStatus.PUBLISHED;
        this._props.publishedAt = new Date();
        this.addDomainEvent(new listing_events_1.ListingPublished(this.id));
        this.touch();
    }
    pause() {
        if (this._props.status !== client_1.ListingStatus.PUBLISHED) {
            throw new Error('Only PUBLISHED listings can be paused');
        }
        this._props.status = client_1.ListingStatus.PAUSED;
        this.addDomainEvent(new listing_events_1.ListingPaused(this.id));
        this.touch();
    }
    markSold() {
        this._props.status = client_1.ListingStatus.SOLD;
        this.touch();
    }
    expire() {
        this._props.status = client_1.ListingStatus.EXPIRED;
        this.touch();
    }
    archive() {
        this._props.status = client_1.ListingStatus.ARCHIVED;
        this.addDomainEvent(new listing_events_1.ListingArchived(this.id));
        this.touch();
    }
    restore() {
        if (this._props.status !== client_1.ListingStatus.ARCHIVED && !this._props.deletedAt) {
            throw new Error('Only ARCHIVED or DELETED listings can be restored');
        }
        this._props.status = client_1.ListingStatus.DRAFT;
        this._props.deletedAt = null;
        this.addDomainEvent(new listing_events_1.ListingRestored(this.id));
        this.touch();
    }
    incrementView() { this._props.viewCount += 1; }
    incrementContact() { this._props.contactCount += 1; }
    update(fields) {
        this._props = { ...this._props, ...fields };
        this.addDomainEvent(new listing_events_1.ListingUpdated(this.id, Object.keys(fields)));
        this.touch();
    }
    softDelete() {
        this._props.deletedAt = new Date();
        this.addDomainEvent(new listing_events_1.ListingDeleted(this.id));
        this.touch();
    }
    static create(id, props) {
        if (props.type === 'FOR_HIRE' && !props.rentalConfig) {
            throw new Error('rentalConfig is required when listing type is FOR_HIRE');
        }
        return new Listing(id, {
            ...props,
            status: props.status ?? client_1.ListingStatus.DRAFT,
            viewCount: props.viewCount ?? 0,
            saveCount: props.saveCount ?? 0,
            contactCount: props.contactCount ?? 0,
            isFeatured: props.isFeatured ?? false,
            negotiable: props.negotiable ?? true,
            tags: props.tags ?? [],
            currency: props.currency ?? 'TZS',
            country: props.country ?? 'TZ',
            deletedAt: props.deletedAt ?? null,
        });
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { _props: { required: true, type: () => Object } };
    }
}
exports.Listing = Listing;
//# sourceMappingURL=listing.entity.js.map