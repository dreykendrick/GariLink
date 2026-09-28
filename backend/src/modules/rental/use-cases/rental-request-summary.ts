import { Currency, RentalStatus } from "@prisma/client";

export interface RentalRequestSummary {
  id: string;
  workspaceId: string;
  listingId: string;
  vehicleId: string;
  status: RentalStatus;
  startDate: Date;
  endDate: Date;
  dailyRate: number;
  currency: Currency;
  totalAmount: number;
  depositAmount: number | null;
  pickupNotes: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  listing: {
    title: string;
    county: string | null;
    vehicle: {
      make: string;
      model: string;
      year: number;
      imageUrl: string | null;
    };
  };
  customer?: {
    id: string;
    displayName: string;
    phoneNumber: string;
    photoUrl: string | null;
  };
}

export const rentalSummarySelect = {
  id: true,
  workspaceId: true,
  listingId: true,
  vehicleId: true,
  status: true,
  startDate: true,
  endDate: true,
  dailyRate: true,
  currency: true,
  totalAmount: true,
  depositAmount: true,
  pickupNotes: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  listing: {
    select: {
      title: true,
      county: true,
      vehicle: {
        select: {
          make: true,
          model: true,
          year: true,
          images: {
            take: 1,
            orderBy: [
              { isPrimary: "desc" as const },
              { order: "asc" as const },
            ],
            select: { media: { select: { publicUrl: true } } },
          },
        },
      },
    },
  },
  customer: {
    select: {
      id: true,
      phoneNumber: true,
      profile: {
        select: {
          displayName: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      },
    },
  },
};

export function toRentalRequestSummary(raw: any): RentalRequestSummary {
  const profile = raw.customer?.profile;
  const fallbackName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ");
  return {
    ...raw,
    dailyRate: Number(raw.dailyRate),
    totalAmount: Number(raw.totalAmount),
    depositAmount:
      raw.depositAmount === null ? null : Number(raw.depositAmount),
    listing: {
      title: raw.listing.title,
      county: raw.listing.county,
      vehicle: {
        make: raw.listing.vehicle.make,
        model: raw.listing.vehicle.model,
        year: raw.listing.vehicle.year,
        imageUrl: raw.listing.vehicle.images[0]?.media.publicUrl ?? null,
      },
    },
    customer: raw.customer
      ? {
          id: raw.customer.id,
          displayName:
            profile?.displayName || fallbackName || "GariLink customer",
          phoneNumber: raw.customer.phoneNumber,
          photoUrl: profile?.photoUrl ?? null,
        }
      : undefined,
  };
}
