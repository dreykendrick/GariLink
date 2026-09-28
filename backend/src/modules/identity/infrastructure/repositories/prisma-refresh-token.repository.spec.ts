import { PrismaService } from "../../../../shared/infrastructure/prisma.service";
import { RefreshToken } from "../../domain/entities/refresh-token.entity";
import { PrismaRefreshTokenRepository } from "./prisma-refresh-token.repository";

describe("PrismaRefreshTokenRepository rotation", () => {
  const replacement = RefreshToken.create({
    id: "new",
    token: "digest",
    userId: "user",
    sessionId: "session",
    familyId: "family",
    expiresAt: new Date(Date.now() + 60000),
  });
  const tx = {
    refreshToken: {
      updateMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const prisma = { $transaction: jest.fn((operation) => operation(tx)) };
  const repository = new PrismaRefreshTokenRepository(
    prisma as unknown as PrismaService,
  );
  beforeEach(() => jest.clearAllMocks());
  it("does not issue a replacement when the old token was already consumed", async () => {
    tx.refreshToken.updateMany.mockResolvedValue({ count: 0 });
    expect(await repository.rotate("old", replacement)).toBe(false);
    expect(tx.refreshToken.create).not.toHaveBeenCalled();
  });
  it("consumes and replaces within a single transaction", async () => {
    tx.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    expect(await repository.rotate("old", replacement)).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "old",
          isRevoked: false,
          userId: "user",
          sessionId: "session",
          familyId: "family",
          session: { isActive: true },
        }),
      }),
    );
    expect(tx.refreshToken.update).toHaveBeenCalledWith({
      where: { id: "old" },
      data: { replacedByTokenId: "new" },
    });
  });
  it("propagates replacement failures so the database transaction rolls back", async () => {
    tx.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    tx.refreshToken.create.mockRejectedValueOnce(new Error("write failed"));
    await expect(repository.rotate("old", replacement)).rejects.toThrow(
      "write failed",
    );
    expect(tx.refreshToken.update).not.toHaveBeenCalled();
  });
});
