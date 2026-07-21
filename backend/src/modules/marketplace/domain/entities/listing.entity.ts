import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { ListingStatus, ListingType, Prisma, Currency } from '@prisma/client';
import { RentalConfigVO } from '../value-objects/rental-config.vo';
import { ListingPublished, ListingPaused, ListingArchived, ListingRestored, ListingUpdated, ListingDeleted } from '../events/listing-events';

export interface ListingProps {
  vehicleId: string;
  workspaceId: string;
  listerId: string;
  type: ListingType;
  title: string;
  description: string | null;
  currency: Currency;
  askingPrice: number;
  negotiable: boolean;
  status: ListingStatus;
  publishedAt: Date | null;
  expiresAt: Date | null;
  viewCount: number;
  saveCount: number;
  contactCount: number;
  isFeatured: boolean;
  featuredUntil: Date | null;
  conditionRating: number | null;
  conditionNotes: string | null;
  tags: string[];
  county: string | null;
  country: string;
  searchVector: Prisma.NullTypes.JsonNull | null;
  deletedAt: Date | null;
  rentalConfig?: RentalConfigVO;
  vehicle?: any;
}

export class Listing extends AggregateRoot<string> {
  private _props: ListingProps;

  constructor(id: string, props: ListingProps, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
    this._props = { ...props };
  }

  // ─── Getters ──────────────────────────────────────────────────────────
  get vehicleId(): string { return this._props.vehicleId; }
  get workspaceId(): string { return this._props.workspaceId; }
  get listerId(): string { return this._props.listerId; }
  get type(): ListingType { return this._props.type; }
  get title(): string { return this._props.title; }
  get description(): string | null { return this._props.description; }
  get askingPrice(): number { return this._props.askingPrice; }
  get currency(): Currency { return this._props.currency; }
  get negotiable(): boolean { return this._props.negotiable; }
  get status(): ListingStatus { return this._props.status; }
  get publishedAt(): Date | null { return this._props.publishedAt; }
  get isFeatured(): boolean { return this._props.isFeatured; }
  get viewCount(): number { return this._props.viewCount; }
  get conditionRating(): number | null { return this._props.conditionRating; }
  get tags(): string[] { return [...this._props.tags]; }
  get rentalConfig(): RentalConfigVO | undefined { return this._props.rentalConfig; }
  get vehicle(): any | undefined { return this._props.vehicle; }
  get deletedAt(): Date | null { return this._props.deletedAt; }
  get props(): Readonly<ListingProps> { return { ...this._props }; }

  // ─── Domain rules ─────────────────────────────────────────────────────

  isDraft(): boolean { return this._props.status === ListingStatus.DRAFT; }
  isActive(): boolean { return this._props.status === ListingStatus.PUBLISHED; }

  publish(): void {
    if (this._props.status !== ListingStatus.DRAFT && this._props.status !== ListingStatus.PAUSED) {
      throw new Error('Only DRAFT or PAUSED listings can be published');
    }
    
    // Validation
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

    this._props.status = ListingStatus.PUBLISHED;
    this._props.publishedAt = new Date();
    this.addDomainEvent(new ListingPublished(this.id));
    this.touch();
  }

  pause(): void {
    if (this._props.status !== ListingStatus.PUBLISHED) {
      throw new Error('Only PUBLISHED listings can be paused');
    }
    this._props.status = ListingStatus.PAUSED;
    this.addDomainEvent(new ListingPaused(this.id));
    this.touch();
  }

  markSold(): void {
    this._props.status = ListingStatus.SOLD;
    this.touch();
  }

  expire(): void {
    this._props.status = ListingStatus.EXPIRED;
    this.touch();
  }

  archive(): void {
    this._props.status = ListingStatus.ARCHIVED;
    this.addDomainEvent(new ListingArchived(this.id));
    this.touch();
  }

  restore(): void {
    if (this._props.status !== ListingStatus.ARCHIVED && !this._props.deletedAt) {
      throw new Error('Only ARCHIVED or DELETED listings can be restored');
    }
    this._props.status = ListingStatus.DRAFT;
    this._props.deletedAt = null;
    this.addDomainEvent(new ListingRestored(this.id));
    this.touch();
  }

  incrementView(): void { this._props.viewCount += 1; }
  incrementContact(): void { this._props.contactCount += 1; }

  update(fields: Partial<Omit<ListingProps, 'vehicleId' | 'workspaceId' | 'listerId'>>): void {
    this._props = { ...this._props, ...fields };
    this.addDomainEvent(new ListingUpdated(this.id, Object.keys(fields)));
    this.touch();
  }

  softDelete(): void {
    this._props.deletedAt = new Date();
    this.addDomainEvent(new ListingDeleted(this.id));
    this.touch();
  }

  static create(id: string, props: ListingProps): Listing {
    if (props.type === 'FOR_HIRE' && !props.rentalConfig) {
      throw new Error('rentalConfig is required when listing type is FOR_HIRE');
    }

    return new Listing(id, {
      ...props,
      status: props.status ?? ListingStatus.DRAFT,
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
}
