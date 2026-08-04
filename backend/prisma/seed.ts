import {
  PrismaClient,
  UserRole,
  WorkspaceType,
  WorkspaceMemberRole,
  VehicleStatus,
  VehicleType,
  BodyType,
  FuelType,
  Transmission,
  Drivetrain,
  VehicleCondition,
  ListingType,
  ListingStatus,
  CapabilityType,
  CapabilityStatus,
  Currency,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main(): Promise<void> {
  console.log('🌱 Starting GariLink Supabase database seed...');

  // 1. Admin User
  const admin = await prisma.user.upsert({
    where: { phoneNumber: '+255700000000' },
    update: {},
    create: {
      phoneNumber: '+255700000000',
      email: 'admin@garilink.co.tz',
      passwordHash: await hash('AdminPass123'),
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
          firstName: 'GariLink',
          lastName: 'Admin',
          displayName: 'System Admin',
          country: 'TZ',
          timezone: 'Africa/Dar_es_Salaam',
          language: 'sw',
          completionPercentage: 100,
        },
      },
    },
  });
  console.log(`✅ Admin user created: ${admin.phoneNumber}`);

  // 2. Dealer User
  const dealer = await prisma.user.upsert({
    where: { phoneNumber: '+255712345678' },
    update: {},
    create: {
      phoneNumber: '+255712345678',
      email: 'dealer@garilink.co.tz',
      passwordHash: await hash('DealerPass123'),
      isPhoneVerified: true,
      isEmailVerified: true,
      isActive: true,
      roles: {
        create: [
          { role: UserRole.DEALER },
          { role: UserRole.PRIVATE_OWNER },
          { role: UserRole.CUSTOMER },
        ],
      },
      profile: {
        create: {
          firstName: 'Juma',
          lastName: 'Rashid',
          displayName: 'Juma Motors',
          county: 'Dar es Salaam',
          city: 'Kinondoni',
          country: 'TZ',
          timezone: 'Africa/Dar_es_Salaam',
          completionPercentage: 90,
        },
      },
      capabilities: {
        create: [
          {
            type: CapabilityType.LIST_VEHICLES,
            status: CapabilityStatus.ACTIVE,
            grantedAt: new Date(),
          },
          {
            type: CapabilityType.MANAGE_LISTINGS,
            status: CapabilityStatus.ACTIVE,
            grantedAt: new Date(),
          },
          {
            type: CapabilityType.MANAGE_FLEET,
            status: CapabilityStatus.ACTIVE,
            grantedAt: new Date(),
          },
        ],
      },
    },
  });
  console.log(`✅ Dealer user created: ${dealer.phoneNumber}`);

  // 3. Customer User
  const customer = await prisma.user.upsert({
    where: { phoneNumber: '+255755123456' },
    update: {},
    create: {
      phoneNumber: '+255755123456',
      email: 'customer@garilink.co.tz',
      passwordHash: await hash('CustomerPass123'),
      isPhoneVerified: true,
      isActive: true,
      roles: {
        create: [{ role: UserRole.CUSTOMER }],
      },
      profile: {
        create: {
          firstName: 'Amina',
          lastName: 'Hassan',
          displayName: 'Amina H.',
          county: 'Arusha',
          city: 'Arusha',
          country: 'TZ',
          timezone: 'Africa/Dar_es_Salaam',
          completionPercentage: 80,
        },
      },
    },
  });
  console.log(`✅ Customer user created: ${customer.phoneNumber}`);

  // 4. Dealer Workspace
  const dealerWorkspace = await prisma.workspace.upsert({
    where: { slug: 'juma-motors-tz' },
    update: {},
    create: {
      name: 'Juma Motors Tanzania',
      slug: 'juma-motors-tz',
      type: WorkspaceType.DEALERSHIP,
      ownerId: dealer.id,
      county: 'Dar es Salaam',
      city: 'Kinondoni',
      country: 'TZ',
      isVerified: true,
      isActive: true,
      members: {
        create: {
          userId: dealer.id,
          role: WorkspaceMemberRole.OWNER,
        },
      },
    },
  });
  console.log(`✅ Dealer workspace created: ${dealerWorkspace.name}`);

  // 5. Customer Personal Workspace
  const customerWorkspace = await prisma.workspace.upsert({
    where: { slug: 'amina-personal-workspace' },
    update: {},
    create: {
      name: "Amina's Garage",
      slug: 'amina-personal-workspace',
      type: WorkspaceType.PERSONAL,
      ownerId: customer.id,
      county: 'Arusha',
      city: 'Arusha',
      country: 'TZ',
      isActive: true,
      members: {
        create: {
          userId: customer.id,
          role: WorkspaceMemberRole.OWNER,
        },
      },
    },
  });
  console.log(`✅ Customer personal workspace created: ${customerWorkspace.name}`);

  // 6. Vehicles & Listings
  const vehiclesData = [
    {
      make: 'Toyota',
      model: 'Land Cruiser V8',
      year: 2021,
      type: VehicleType.CAR,
      bodyType: BodyType.SUV,
      fuelType: FuelType.DIESEL,
      transmission: Transmission.AUTOMATIC,
      drivetrain: Drivetrain.FOUR_WD,
      engineCapacity: 4500,
      condition: VehicleCondition.FOREIGN_USED,
      mileage: 32000,
      features: ['4WD', 'Leather Seats', 'Sunroof', '360 Camera', 'Cruise Control'],
      description: 'Clean Toyota Land Cruiser V8, full option, pristine condition.',
      status: VehicleStatus.AVAILABLE,
      listingTitle: '2021 Toyota Land Cruiser V8 — Foreign Used',
      price: 185000000,
      listingType: ListingType.FOR_SALE,
    },
    {
      make: 'Subaru',
      model: 'Forester XT',
      year: 2018,
      type: VehicleType.CAR,
      bodyType: BodyType.CROSSOVER,
      fuelType: FuelType.PETROL,
      transmission: Transmission.AUTOMATIC,
      drivetrain: Drivetrain.AWD,
      engineCapacity: 2000,
      condition: VehicleCondition.LOCAL_USED,
      mileage: 65000,
      features: ['AWD', 'Eyesight', 'Turbo', 'X-Mode', 'Heated Seats'],
      description: 'Subaru Forester XT Turbo 2.0L. Very fast and clean.',
      status: VehicleStatus.AVAILABLE,
      listingTitle: '2018 Subaru Forester 2.0 XT Turbo AWD',
      price: 45000000,
      listingType: ListingType.FOR_SALE,
    },
    {
      make: 'Mercedes-Benz',
      model: 'G-Wagon G63 AMG',
      year: 2022,
      type: VehicleType.CAR,
      bodyType: BodyType.SUV,
      fuelType: FuelType.PETROL,
      transmission: Transmission.AUTOMATIC,
      drivetrain: Drivetrain.FOUR_WD,
      engineCapacity: 4000,
      condition: VehicleCondition.NEW,
      mileage: 5000,
      features: ['V8 Biturbo', 'Burmester Audio', 'Nappa Leather', 'AMG Performance Package'],
      description: 'Luxury Beast Mercedes-AMG G63 in Obsidian Black.',
      status: VehicleStatus.AVAILABLE,
      listingTitle: '2022 Mercedes-AMG G63 V8 Biturbo',
      price: 420000000,
      listingType: ListingType.FOR_SALE,
    },
  ];

  for (const v of vehiclesData) {
    const vehicle = await prisma.vehicle.create({
      data: {
        workspaceId: dealerWorkspace.id,
        make: v.make,
        model: v.model,
        year: v.year,
        type: v.type,
        bodyType: v.bodyType,
        fuelType: v.fuelType,
        transmission: v.transmission,
        drivetrain: v.drivetrain,
        engineCapacity: v.engineCapacity,
        condition: v.condition,
        mileage: v.mileage,
        features: v.features,
        description: v.description,
        status: v.status,
        isVerified: true,
      },
    });

    await prisma.listing.create({
      data: {
        vehicleId: vehicle.id,
        workspaceId: dealerWorkspace.id,
        listerId: dealer.id,
        type: v.listingType,
        status: ListingStatus.PUBLISHED,
        title: v.listingTitle,
        askingPrice: v.price,
        currency: Currency.TZS,
        county: 'Dar es Salaam',
        country: 'TZ',
        publishedAt: new Date(),
      },
    });

    console.log(`✅ Seeded: ${v.year} ${v.make} ${v.model} (TZS ${v.price.toLocaleString()})`);
  }

  console.log('\n🎉 GariLink Supabase database successfully seeded with live data!\n');
  console.log('Credentials:');
  console.log('  Admin:    +255700000000 / AdminPass123');
  console.log('  Dealer:   +255712345678 / DealerPass123');
  console.log('  Customer: +255755123456 / CustomerPass123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
