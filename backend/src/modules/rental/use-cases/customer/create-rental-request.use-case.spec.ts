import { Currency } from "@prisma/client";

import { CreateRentalRequestUseCase } from "./create-rental-request.use-case";

describe("CreateRentalRequestUseCase", () => {
  const startDate = new Date(Date.now() + 7 * 86_400_000);
  const endDate = new Date(Date.now() + 10 * 86_400_000);

  function setup(overrides: Record<string, unknown> = {}) {
    let saved: any;
    const rentals = {
      save: jest.fn(async (rental) => {
        saved = rental;
      }),
    } as any;
    const listing = {
      id: "listing-1",
      vehicleId: "vehicle-1",
      workspaceId: "workspace-1",
      listerId: "owner-1",
      currency: Currency.TZS,
      rentalConfig: {
        dailyRate: 100_000,
        depositRequired: true,
        depositAmount: 250_000,
        minimumRentalDays: 1,
        maximumRentalDays: 30,
      },
      ...overrides,
    };
    const prisma = {
      listing: { findFirst: jest.fn().mockResolvedValue(listing) },
      rentalRequest: { findFirst: jest.fn().mockResolvedValue(null) },
      vehicleAvailabilityBlock: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as any;
    return {
      useCase: new CreateRentalRequestUseCase(rentals, prisma),
      prisma,
      getSaved: () => saved,
    };
  }

  it("derives price and ownership from the stored listing", async () => {
    const { useCase, getSaved } = setup();
    const result = await useCase.execute({
      customerId: "customer-1",
      listingId: "listing-1",
      startDate,
      endDate,
    });

    expect(result.isOk).toBe(true);
    expect(getSaved().workspaceId).toBe("workspace-1");
    expect(getSaved().vehicleId).toBe("vehicle-1");
    expect(getSaved().dailyRate).toBe(100_000);
    expect(getSaved().totalAmount).toBe(550_000);
  });

  it("rejects overlapping rental dates", async () => {
    const { useCase, prisma } = setup();
    prisma.rentalRequest.findFirst.mockResolvedValue({ id: "existing" });

    const result = await useCase.execute({
      customerId: "customer-1",
      listingId: "listing-1",
      startDate,
      endDate,
    });

    expect(result.isFail).toBe(true);
    expect(result.error.message).toContain("unavailable");
  });
});
