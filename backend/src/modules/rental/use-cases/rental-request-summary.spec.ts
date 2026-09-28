import { GetMyRentalRequestsUseCase } from "./customer/get-my-rental-requests.use-case";
import { GetWorkspaceRentalRequestsUseCase } from "./owner/get-workspace-rental-requests.use-case";
import { CustomerRentalController } from "../controllers/customer-rental.controller";

describe("Rental summary access and response contract", () => {
  const raw = {
    id: "rental",
    workspaceId: "workspace",
    listingId: "listing",
    vehicleId: "vehicle",
    status: "REQUESTED",
    startDate: new Date("2027-01-01"),
    endDate: new Date("2027-01-03"),
    dailyRate: "100.50",
    totalAmount: "201",
    depositAmount: "50",
    pickupNotes: "Airport pickup",
    rejectionReason: null,
    listing: {
      title: "Family car",
      county: "Nairobi",
      vehicle: {
        make: "Toyota",
        model: "RAV4",
        year: 2024,
        images: [{ media: { publicUrl: "https://example.com/car.jpg" } }],
      },
    },
    customer: {
      id: "customer",
      phoneNumber: "+254700000000",
      profile: {
        firstName: "Test",
        lastName: "Renter",
        displayName: null,
        photoUrl: null,
      },
    },
  };
  const database = () => ({
    rentalRequest: { findMany: jest.fn().mockResolvedValue([raw]) },
    workspaceMember: {
      findFirst: jest.fn().mockResolvedValue({ id: "membership" }),
    },
  });

  it("scopes renter queries and preserves the full summary through the controller", async () => {
    const prisma = database();
    const useCase = new GetMyRentalRequestsUseCase(prisma as any);
    const controller = new CustomerRentalController(
      null as any,
      null as any,
      useCase,
    );
    const response = await controller.getMy({ userId: "customer" });
    expect(prisma.rentalRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customerId: "customer" },
      }),
    );
    expect(response[0]).toMatchObject({
      id: "rental",
      dailyRate: 100.5,
      totalAmount: 201,
      depositAmount: 50,
      pickupNotes: "Airport pickup",
      listing: { vehicle: { imageUrl: "https://example.com/car.jpg" } },
    });
  });

  it("denies workspace access before reading customer information", async () => {
    const prisma = database();
    prisma.workspaceMember.findFirst.mockResolvedValue(null);
    const result = await new GetWorkspaceRentalRequestsUseCase(
      prisma as any,
    ).execute("outsider", "workspace");
    expect(result.isFail).toBe(true);
    expect(prisma.rentalRequest.findMany).not.toHaveBeenCalled();
  });

  it("scopes owner queries and includes the customer identity", async () => {
    const prisma = database();
    const result = await new GetWorkspaceRentalRequestsUseCase(
      prisma as any,
    ).execute("owner", "workspace");
    expect(prisma.workspaceMember.findFirst).toHaveBeenCalledWith({
      where: {
        workspaceId: "workspace",
        userId: "owner",
        status: "ACTIVE",
        role: { in: ["OWNER", "MANAGER"] },
      },
      select: { id: true },
    });
    expect(prisma.rentalRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { workspaceId: "workspace" } }),
    );
    expect(result.value[0].customer).toMatchObject({
      displayName: "Test Renter",
      phoneNumber: "+254700000000",
    });
  });

  it("propagates database failures rather than reporting no rentals", async () => {
    const prisma = database();
    prisma.rentalRequest.findMany.mockRejectedValue(
      new Error("Database unavailable"),
    );
    await expect(
      new GetMyRentalRequestsUseCase(prisma as any).execute("customer"),
    ).rejects.toThrow("Database unavailable");
  });
});
