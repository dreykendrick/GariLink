import { AggregateRoot } from '../../../../shared/domain/aggregate-root.base';
import { ListingStatus, ListingType, Prisma } from '@prisma/client';

export interface ListingProps {
  vehicleId: string;
  workspaceId: string;
  listerId: string;
  type: ListingType;
  title: string;
  description: string | null;
  pricingCurrency: string;
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
  get pricingCurrency(): string { return this._props.pricingCurrency; }
  get negotiable(): boolean { return this._props.negotiable; }
  get status(): ListingStatus { return this._props.status; }
  get publishedAt(): Date | null { return this._props.publishedAt; }
  get isFeatured(): boolean { return this._props.isFeatured; }
  get viewCount(): number { return this._props.viewCount; }
  get conditionRating(): number | null { return this._props.conditionRating; }
  get tags(): string[] { return [...this._props.tags]; }
  get props(): Readonly<ListingProps> { return { ...this._props }; }

  // ─── Domain rules ─────────────────────────────────────────────────────

  isDraft(): boolean { return this._props.status === ListingStatus.DRAFT; }
  isActive(): boolean { return this._props.status === ListingStatus.PUBLISHED; }

  publish(): void {
    if (this._props.status !== ListingStatus.DRAFT) {
      throw new Error('Only DRAFT listings can be published');
    }
    this._props.status = ListingStatus.PUBLISHED;
    this._props.publishedAt = new Date();
    this.touch();
  }

  pause(): void {
    this._props.status = ListingStatus.PAUSED;
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
    this.touch();
  }

  incrementView(): void { this._props.viewCount += 1; }
  incrementContact(): void { this._props.contactCount += 1; }

  update(fields: Partial<Omit<ListingProps, 'vehicleId' | 'workspaceId' | 'listerId'>>): void {
    this._props = { ...this._props, ...fields };
    this.touch();
  }

  static create(id: string, props: ListingProps): Listing {
    return new Listing(id, {
      ...props,
      status: props.status ?? ListingStatus.DRAFT,
      viewCount: props.viewCount ?? 0,
      saveCount: props.saveCount ?? 0,
      contactCount: props.contactCount ?? 0,
      isFeatured: props.isFeatured ?? false,
      negotiable: props.negotiable ?? true,
      tags: props.tags ?? [],
      pricingCurrency: props.pricingCurrency ?? 'KES',
      country: props.country ?? 'KE',
    });
  }
}
