/**
 * GariLink Database Seed
 *
 * Creates:
 * - 1 admin user
 * - 2 test users with profiles
 * - 1 workspace (Personal) per user
 * - Sample vehicle makes/models reference data
 * - 1 sample listing
 */

import {
  PrismaClient,
  UserRole,
  WorkspaceType,
  WorkspaceMemberRole,
  VehicleStatus,
  FuelType,
  TransmissionType,
  BodyType,
  ListingStatus,
  ListingType,
  CapabilityType,
  CapabilityStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main(): Promise<void> {
  console.log('🌱 Starting GariLink database seed...');

  // ─── Admin User ───────────────────────────────────────────────────────

  const adminId = uuidv4();
  const admin = await prisma.user.upsert({
    where: { phoneNumber: '+254700000000' },
    update: {},
    create: {
      id: adminId,
      phoneNumber: '+254700000000',
      email: 'admin@garilink.co.ke',
      passwordHash: await hash('AdminPass1'),
      isPhoneVerified: true,
      isEmailVerified: true,
      isActive: true,
      roles: {
        create: [
          { role: UserRole.ADMIN },
          { role: UserRole.CUSTOMER },
        ],
      },
      profile: {
        create: {
          id: uuidv4(),
          firstName: 'GariLink',
          lastName: 'Admin',
          displayName: 'Admin',
          country: 'KE',
          timezone: 'Africa/Nairobi',
          language: 'en',
          completionPercentage: 55,
        },
      },
    },
  });
  console.log(`✅ Admin user: ${admin.phoneNumber}`);

  // ─── Test User 1 — Dealer ─────────────────────────────────────────────

  const dealer1Id = uuidv4();
  const dealer1 = await prisma.user.upsert({
    where: { phoneNumber: '+254712345678' },
    update: {},
    create: {
      id: dealer1Id,
      phoneNumber: '+254712345678',
      email: 'john.dealer@example.com',
      passwordHash: await hash('DealerPass1'),
      isPhoneVerified: true,
      isEmailVerified: false,
      isActive: true,
      roles: {
        create: [{ role: UserRole.DEALER }, { role: UserRole.CUSTOMER }],
      },
      profile: {
        create: {
          id: uuidv4(),
          firstName: 'John',
          lastName: 'Kamau',
          displayName: 'John K.',
          county: 'Nairobi',
          city: 'Nairobi',
          country: 'KE',
          timezone: 'Africa/Nairobi',
          language: 'en',
          completionPercentage: 70,
        },
      },
      capabilities: {
        create: [
          {
            id: uuidv4(),
            type: CapabilityType.LIST_VEHICLES,
            status: CapabilityStatus.ACTIVE,
            grantedAt: new Date(),
            requestedAt: new Date(),
          },
          {
            id: uuidv4(),
            type: CapabilityType.MANAGE_LISTINGS,
            status: CapabilityStatus.ACTIVE,
            grantedAt: new Date(),
            requestedAt: new Date(),
          },
        ],
      },
    },
  });
  console.log(`✅ Dealer user: ${dealer1.phoneNumber}`);

  // ─── Test User 2 — Buyer ──────────────────────────────────────────────

  const buyer1Id = uuidv4();
  const buyer1 = await prisma.user.upsert({
    where: { phoneNumber: '+254722987654' },
    update: {},
    create: {
      id: buyer1Id,
      phoneNumber: '+254722987654',
      email: 'mary.buyer@example.com',
      passwordHash: await hash('BuyerPass1'),
      isPhoneVerified: true,
      isActive: true,
      roles: {
        create: [{ role: UserRole.CUSTOMER }],
      },
      profile: {
        create: {
          id: uuidv4(),
          firstName: 'Mary',
          lastName: 'Wanjiku',
          county: 'Kiambu',
          city: 'Thika',
          country: 'KE',
          timezone: 'Africa/Nairobi',
          language: 'en',
          completionPercentage: 50,
        },
      },
    },
  });
  console.log(`✅ Buyer user: ${buyer1.phoneNumber}`);

  // ─── Workspace for Dealer ─────────────────────────────────────────────

  const dealerWorkspaceId = uuidv4();
  const dealerWorkspace = await prisma.workspace.upsert({
    where: { id: dealerWorkspaceId },
    update: {},
    create: {
      id: dealerWorkspaceId,
      name: "John's Auto Dealership",
      type: WorkspaceType.DEALERSHIP,
      ownerId: dealer1Id,
      country: 'KE',
      currency: 'KES',
      isVerified: false,
      isActive: true,
      members: {
        create: {
          id: uuidv4(),
          userId: dealer1Id,
          role: WorkspaceMemberRole.OWNER,
          joinedAt: new Date(),
          isActive: true,
        },
      },
    },
  });
  console.log(`✅ Dealer workspace: ${dealerWorkspace.name}`);

  // ─── Personal Workspace for Buyer ─────────────────────────────────────

  const buyerWorkspaceId = uuidv4();
  await prisma.workspace.upsert({
    where: { id: buyerWorkspaceId },
    update: {},
    create: {
      id: buyerWorkspaceId,
      name: "Mary's Garage",
      type: WorkspaceType.PERSONAL,
      ownerId: buyer1Id,
      country: 'KE',
      currency: 'KES',
      isVerified: false,
      isActive: true,
      members: {
        create: {
          id: uuidv4(),
          userId: buyer1Id,
          role: WorkspaceMemberRole.OWNER,
          joinedAt: new Date(),
          isActive: true,
        },
      },
    },
  });
  console.log(`✅ Buyer workspace created`);

  // ─── Sample Vehicle ───────────────────────────────────────────────────

  const vehicleId = uuidv4();
  const vehicle = await prisma.vehicle.upsert({
    where: { id: vehicleId },
    update: {},
    create: {
      id: vehicleId,
      workspaceId: dealerWorkspaceId,
      make: 'Toyota',
      model: 'Land Cruiser',
      year: 2019,
      variant: 'V8 GX',
      color: 'White',
      fuelType: FuelType.DIESEL,
      transmissionType: TransmissionType.AUTOMATIC,
      bodyType: BodyType.SUV,
      engineSizeCC: 4608,
      horsePower: 232,
      mileageKm: 45000,
      rightHandDrive: true,
      seats: 8,
      doors: 4,
      status: VehicleStatus.AVAILABLE,
      features: ['4WD', 'Leather Seats', 'Sunroof', 'Reverse Camera', 'Climate Control'],
      importStatus: 'LOCAL',
      county: 'Nairobi',
      country: 'KE',
      description: 'Well-maintained Toyota Land Cruiser V8. Full service history. One careful owner.',
    },
  });
  console.log(`✅ Sample vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`);

  // ─── Sample Listing ───────────────────────────────────────────────────

  const listingId = uuidv4();
  await prisma.listing.upsert({
    where: { id: listingId },
    update: {},
    create: {
      id: listingId,
      vehicleId,
      workspaceId: dealerWorkspaceId,
      listerId: dealer1Id,
      type: ListingType.SALE,
      title: '2019 Toyota Land Cruiser V8 GX — Well Maintained',
      description:
        'Excellent condition Toyota Land Cruiser V8. Full service history at Toyota Kenya. ' +
        'Accident free. Clean log book. Loaded with features. Trade-in accepted.',
      askingPrice: 12500000,
      pricingCurrency: 'KES',
      negotiable: true,
      status: ListingStatus.ACTIVE,
      publishedAt: new Date(),
      conditionRating: 4,
      conditionNotes: 'Excellent condition, minor wear on driver seat',
      tags: ['landcruiser', 'v8', 'toyota', 'suv', '4wd'],
      county: 'Nairobi',
      country: 'KE',
    },
  });
  console.log(`✅ Sample listing created — Toyota Land Cruiser @ KES 12,500,000`);

  // ─── Vehicle Makes Reference Data ─────────────────────────────────────

  const makes = [
    'Toyota', 'Nissan', 'Mazda', 'Mitsubishi', 'Honda', 'Isuzu', 'Land Rover',
    'Mercedes-Benz', 'BMW', 'Volkswagen', 'Subaru', 'Suzuki', 'Hyundai', 'Ford',
    'Jeep', 'Lexus', 'Peugeot', 'Volvo', 'Porsche', 'Audi',
  ];

  for (const make of makes) {
    await prisma.vehicleMake.upsert({
      where: { name: make },
      update: {},
      create: { name: make, country: 'ALL' },
    });
  }
  console.log(`✅ ${makes.length} vehicle makes seeded`);

  console.log('\n🎉 GariLink database seeded successfully!\n');
  console.log('Test credentials:');
  console.log('  Admin:  +254700000000 / AdminPass1');
  console.log('  Dealer: +254712345678 / DealerPass1');
  console.log('  Buyer:  +254722987654 / BuyerPass1');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
