// GariLink API Type Definitions
// Mirrors the backend Prisma schema and response shapes

export type UserRole =
  | 'CUSTOMER'
  | 'PRIVATE_OWNER'
  | 'DEALER'
  | 'MECHANIC'
  | 'INSPECTOR'
  | 'ADMIN';

export type CapabilityType =
  | 'LIST_VEHICLES'
  | 'MANAGE_LISTINGS'
  | 'MANAGE_RENTAL_LISTINGS'
  | 'MANAGE_FLEET'
  | 'PERFORM_INSPECTIONS'
  | 'PERFORM_REPAIRS'
  | 'ADMIN';

export type CapabilityStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'REJECTED';
export type OtpPurpose = 'PHONE_VERIFICATION' | 'PASSWORD_RESET' | 'LOGIN_2FA' | 'EMAIL_VERIFICATION';
export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';

export type WorkspaceType =
  | 'PERSONAL'
  | 'DEALERSHIP'
  | 'RENTAL_COMPANY'
  | 'FLEET_OWNER'
  | 'GARAGE'
  | 'LOGISTICS'
  | 'SPARE_PARTS'
  | 'INSURANCE';

export type WorkspaceMemberRole = 'OWNER' | 'ADMIN' | 'AGENT' | 'VIEWER';

export type VehicleStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'SOLD'
  | 'RENTED'
  | 'IN_TRANSIT'
  | 'UNDER_INSPECTION'
  | 'UNDER_REPAIR'
  | 'RETIRED';

export type FuelType = 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'PLUGIN_HYBRID' | 'LPG' | 'CNG';
export type TransmissionType = 'MANUAL' | 'AUTOMATIC' | 'CVT' | 'SEMI_AUTOMATIC';
export type BodyType = 'SEDAN' | 'SUV' | 'HATCHBACK' | 'PICKUP' | 'VAN' | 'MINIBUS' | 'COUPE' | 'CONVERTIBLE' | 'WAGON' | 'TRUCK' | 'BUS';

export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'SOLD' | 'EXPIRED' | 'ARCHIVED';
export type ListingType = 'SALE' | 'RENTAL' | 'AUCTION' | 'LEASE';
export type InquiryStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CLOSED';

// ─── Auth Types ────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  phoneNumber: string;
  email: string | null;
  roles: UserRole[];
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  session: { id: string; deviceName: string | null };
}

// ─── Profile Types ─────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  photoUrl: string | null;
  bio: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  county: string | null;
  city: string | null;
  country: string;
  completionPercentage: number;
}

export interface CurrentUserResponse {
  id: string;
  phoneNumber: string;
  email: string | null;
  roles: UserRole[];
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  profile: UserProfile | null;
  capabilities: Array<{ id: string; type: CapabilityType; status: CapabilityStatus }>;
}

// ─── Workspace Types ───────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  slug: string | null;
  description: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  isActive: boolean;
  country: string;
  currency: string;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceMemberRole;
  isActive: boolean;
  joinedAt: string | null;
  user?: { id: string; phoneNumber: string; email: string | null };
}

// ─── Vehicle Types ─────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  workspaceId: string;
  make: string;
  model: string;
  year: number;
  variant: string | null;
  vin: string | null;
  registrationPlate: string | null;
  color: string | null;
  fuelType: FuelType | null;
  transmissionType: TransmissionType | null;
  bodyType: BodyType | null;
  engineSizeCC: number | null;
  horsePower: number | null;
  mileageKm: number | null;
  rightHandDrive: boolean;
  seats: number | null;
  doors: number | null;
  status: VehicleStatus;
  description: string | null;
  features: string[];
  county: string | null;
  country: string;
  createdAt: string;
}

// ─── Listing Types ─────────────────────────────────────────────────────────

export interface Listing {
  id: string;
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
  publishedAt: string | null;
  viewCount: number;
  saveCount: number;
  contactCount: number;
  isFeatured: boolean;
  conditionRating: number | null;
  tags: string[];
  county: string | null;
  country: string;
  vehicle?: Partial<Vehicle>;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  listingId: string;
  inquirerId: string;
  status: InquiryStatus;
  message: string;
  offeredPrice: number | null;
  offerCurrency: string | null;
  respondedAt: string | null;
  createdAt: string;
}

// ─── Pagination ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Media ────────────────────────────────────────────────────────────────

export interface MediaFile {
  id: string;
  entityType: string;
  entityId: string;
  subType: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl: string;
  width: number | null;
  height: number | null;
  createdAt: string;
}

// ─── API Error ────────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  path: string;
  timestamp: string;
}
