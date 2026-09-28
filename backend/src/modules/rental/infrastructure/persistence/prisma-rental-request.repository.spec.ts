import { BlockType, Currency, RentalStatus } from "@prisma/client";
import { PrismaService } from "../../../../shared/infrastructure/prisma.service";
import { ConflictError } from "../../../../core/errors/app-error";
import { RentalRequest } from "../../domain/entities/rental-request.entity";
import { PrismaRentalRequestRepository } from "./prisma-rental-request.repository";

describe("Rental persistence safeguards", () => {
  function fixture(status: RentalStatus = RentalStatus.REQUESTED) {
    const rental = RentalRequest.create("test-rental", {
      customerId: "customer",
      workspaceId: "workspace",
      vehicleId: "vehicle",
      listingId: "listing",
      status,
      startDate: new Date("2030-01-01"),
      endDate: new Date("2030-01-03"),
      dailyRate: 100,
      totalAmount: 200,
      currency: Currency.TZS,
      depositAmount: null,
      pickupNotes: null,
      rejectionReason: null,
    });
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: "vehicle" }]),
      rentalRequest: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
      },
      vehicleAvailabilityBlock: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    };
    const prisma = { $transaction: jest.fn((operation) => operation(tx)) };
    const repo = new PrismaRentalRequestRepository(
      prisma as unknown as PrismaService,
    );
    return { rental, tx, prisma, repo };
  }
  it("locks the vehicle before the final conflict check and write", async () => {
    const { rental, tx, repo } = fixture();
    await repo.save(rental);
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(
      tx.rentalRequest.findFirst.mock.invocationCallOrder[0],
    );
    expect(tx.rentalRequest.findFirst.mock.invocationCallOrder[0]).toBeLessThan(
      tx.rentalRequest.upsert.mock.invocationCallOrder[0],
    );
  });
  it("rejects an overlap found after the earlier availability query", async () => {
    const { rental, tx, repo } = fixture();
    tx.rentalRequest.findFirst.mockResolvedValue({ id: "another-rental" });
    await expect(repo.save(rental)).rejects.toBeInstanceOf(ConflictError);
    expect(tx.rentalRequest.upsert).not.toHaveBeenCalled();
  });
  it("does not overwrite a concurrent status change", async () => {
    const { rental, tx, repo } = fixture();
    rental.approve();
    tx.rentalRequest.findUnique.mockResolvedValue({
      status: RentalStatus.CANCELLED,
    });
    await expect(repo.save(rental)).rejects.toBeInstanceOf(ConflictError);
    expect(tx.vehicleAvailabilityBlock.create).not.toHaveBeenCalled();
  });
  it("saves approval and its availability block in one transaction", async () => {
    const { rental, tx, prisma, repo } = fixture();
    tx.rentalRequest.findUnique.mockResolvedValue({
      status: RentalStatus.REQUESTED,
    });
    rental.approve();
    await repo.save(rental);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.vehicleAvailabilityBlock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        vehicleId: "vehicle",
        type: BlockType.BOOKED,
        reason: "Rental Request: test-rental",
      }),
    });
  });
  it("releases only the cancelled booking reservation", async () => {
    const { rental, tx, repo } = fixture(RentalStatus.APPROVED);
    tx.rentalRequest.findUnique.mockResolvedValue({
      status: RentalStatus.APPROVED,
    });
    rental.cancel();
    await repo.save(rental);
    expect(tx.vehicleAvailabilityBlock.deleteMany).toHaveBeenCalledWith({
      where: {
        vehicleId: "vehicle",
        type: BlockType.BOOKED,
        reason: "Rental Request: test-rental",
      },
    });
  });
  it.each([
    RentalStatus.REJECTED,
    RentalStatus.CANCELLED,
    RentalStatus.ACTIVE,
    RentalStatus.COMPLETED,
  ])("does not allow cancellation from %s", (status) => {
    expect(() => fixture(status).rental.cancel()).toThrow();
  });
});
