// Integration check for the isolated development database only. Builds first.
// Run: node --env-file=.env scripts/check-local-concurrency.cjs
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const {
  PrismaClient,
  RentalStatus,
  Currency,
  VehicleType,
  BodyType,
  FuelType,
  Transmission,
  Drivetrain,
  VehicleCondition,
} = require("@prisma/client");
const {
  PrismaRentalRequestRepository,
} = require("../dist/src/modules/rental/infrastructure/persistence/prisma-rental-request.repository");
const {
  RentalRequest,
} = require("../dist/src/modules/rental/domain/entities/rental-request.entity");
const {
  PrismaRefreshTokenRepository,
} = require("../dist/src/modules/identity/infrastructure/repositories/prisma-refresh-token.repository");
const {
  RefreshToken,
} = require("../dist/src/modules/identity/domain/entities/refresh-token.entity");
const {
  PrismaListingRepository,
} = require("../dist/src/modules/marketplace/infrastructure/repositories/prisma-listing.repository");

const url = new URL(process.env.DATABASE_URL || "postgresql://invalid/");
if (
  !["127.0.0.1", "localhost"].includes(url.hostname) ||
  url.port !== "5433" ||
  url.pathname !== "/garilink_dev" ||
  process.env.NODE_ENV === "production"
) {
  throw new Error(
    "This check only runs against the isolated localhost:5433/garilink_dev database.",
  );
}
const prisma = new PrismaClient();
const marker = `qa-${randomUUID()}`;
const ids = {
  user: marker,
  workspace: `${marker}-workspace`,
  vehicle: `${marker}-vehicle`,
  listing: `${marker}-listing`,
  session: `${marker}-session`,
};

async function main() {
  try {
    await prisma.user.create({
      data: {
        id: ids.user,
        phoneNumber: marker,
        passwordHash: "NO_LOGIN_QA_FIXTURE",
      },
    });
    await prisma.workspace.create({
      data: {
        id: ids.workspace,
        name: "Temporary QA fixture",
        slug: marker,
        type: "PERSONAL",
        ownerId: ids.user,
      },
    });
    await prisma.vehicle.create({
      data: {
        id: ids.vehicle,
        workspaceId: ids.workspace,
        type: VehicleType.CAR,
        bodyType: Object.values(BodyType)[0],
        fuelType: Object.values(FuelType)[0],
        transmission: Object.values(Transmission)[0],
        drivetrain: Object.values(Drivetrain)[0],
        condition: Object.values(VehicleCondition)[0],
        make: "QA",
        model: "Fixture",
        year: 2025,
        mileage: 0,
        features: [],
      },
    });
    await prisma.listing.create({
      data: {
        id: ids.listing,
        vehicleId: ids.vehicle,
        workspaceId: ids.workspace,
        listerId: ids.user,
        type: "FOR_HIRE",
        title: "Unpublished QA fixture",
        country: "TZ",
        tags: [],
      },
    });

    const listingRepository = new PrismaListingRepository(prisma);
    await listingRepository.search({
      type: "FOR_HIRE",
      city: "Dar es Salaam",
      priceMin: 0,
      priceMax: 200,
      sortBy: "price_asc",
    });
    await listingRepository.toggleFavourite(ids.user, ids.vehicle, "save");
    await listingRepository.toggleFavourite(ids.user, ids.vehicle, "save");
    assert.equal(
      await prisma.savedVehicle.count({ where: { userId: ids.user } }),
      1,
    );
    assert.equal(
      (await listingRepository.findSavedListings(ids.user)).length,
      0,
      "Drafts must not leak through saved listings",
    );
    console.log(
      "PASS: rental search query, idempotent saves and draft visibility",
    );

    const repository = new PrismaRentalRequestRepository(prisma);
    const makeRental = (id) =>
      RentalRequest.create(id, {
        customerId: ids.user,
        workspaceId: ids.workspace,
        vehicleId: ids.vehicle,
        listingId: ids.listing,
        status: RentalStatus.REQUESTED,
        startDate: new Date("2099-01-01"),
        endDate: new Date("2099-01-03"),
        dailyRate: 100,
        currency: Currency.TZS,
        totalAmount: 200,
        depositAmount: null,
        pickupNotes: null,
        rejectionReason: null,
      });
    const rentals = [makeRental(`${marker}-a`), makeRental(`${marker}-b`)];
    const results = await Promise.allSettled(
      rentals.map((rental) => repository.save(rental)),
    );
    assert.equal(
      results.filter((result) => result.status === "fulfilled").length,
      1,
      "Exactly one overlapping request must succeed",
    );
    const rejected = results.find((result) => result.status === "rejected");
    assert.equal(rejected.reason.statusCode, 409);
    const winner =
      rentals[results.findIndex((result) => result.status === "fulfilled")];
    const approved = await repository.findById(winner.id);
    const stale = await repository.findById(winner.id);
    approved.approve();
    await repository.save(approved);
    assert.equal(
      await prisma.vehicleAvailabilityBlock.count({
        where: { vehicleId: ids.vehicle },
      }),
      1,
    );
    stale.cancel();
    await assert.rejects(
      repository.save(stale),
      (error) => error.statusCode === 409,
    );
    const cancelled = await repository.findById(winner.id);
    cancelled.cancel();
    await repository.save(cancelled);
    assert.equal(
      await prisma.vehicleAvailabilityBlock.count({
        where: { vehicleId: ids.vehicle },
      }),
      0,
    );
    console.log(
      "PASS: concurrent requests, stale transition rejection, atomic approval and cancellation release",
    );

    await prisma.session.create({
      data: { id: ids.session, userId: ids.user },
    });
    const tokenRepository = new PrismaRefreshTokenRepository(prisma);
    const makeToken = (suffix) =>
      RefreshToken.create({
        id: `${marker}-${suffix}`,
        token: `${marker}-digest-${suffix}`,
        userId: ids.user,
        sessionId: ids.session,
        familyId: marker,
        expiresAt: new Date(Date.now() + 60000),
      });
    const original = makeToken("original");
    await tokenRepository.save(original);
    const rotations = await Promise.all([
      tokenRepository.rotate(original.id, makeToken("first")),
      tokenRepository.rotate(original.id, makeToken("second")),
    ]);
    assert.equal(rotations.filter(Boolean).length, 1);
    assert.equal(
      await prisma.refreshToken.count({
        where: { userId: ids.user, isRevoked: false },
      }),
      1,
    );
    console.log(
      "PASS: concurrent refresh rotation issues exactly one replacement",
    );
  } finally {
    // Exact IDs owned by this invocation only; never touch seeded/user records.
    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId: ids.user } }),
      prisma.session.deleteMany({ where: { userId: ids.user } }),
      prisma.savedVehicle.deleteMany({ where: { userId: ids.user } }),
      prisma.vehicleAvailabilityBlock.deleteMany({
        where: { vehicleId: ids.vehicle },
      }),
      prisma.rentalRequest.deleteMany({ where: { vehicleId: ids.vehicle } }),
      prisma.listing.deleteMany({ where: { id: ids.listing } }),
      prisma.vehicle.deleteMany({ where: { id: ids.vehicle } }),
      prisma.workspace.deleteMany({ where: { id: ids.workspace } }),
      prisma.user.deleteMany({ where: { id: ids.user } }),
    ]);
    await prisma.$disconnect();
    console.log(
      "Temporary QA fixtures removed; seeded accounts and vehicles preserved.",
    );
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
