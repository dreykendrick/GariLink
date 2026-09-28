import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../../shared/infrastructure/prisma.service";
import { JwtStrategy } from "./jwt.strategy";

describe("JwtStrategy session authorization", () => {
  const payload = {
    sub: "user",
    userId: "user",
    sessionId: "session",
    roles: ["ADMIN"],
  };
  const prisma = {
    user: { findUnique: jest.fn() },
    session: { updateMany: jest.fn() },
  };
  let strategy: JwtStrategy;
  beforeEach(() => {
    jest.resetAllMocks();
    prisma.user.findUnique.mockResolvedValue({
      id: "user",
      isActive: true,
      roles: [{ role: "CUSTOMER" }],
    });
    prisma.session.updateMany.mockResolvedValue({ count: 1 });
    strategy = new JwtStrategy(
      new ConfigService({ app: { jwt: { accessSecret: "test-only-secret" } } }),
      prisma as unknown as PrismaService,
    );
  });
  it("rejects a revoked or missing session despite a valid JWT", async () => {
    prisma.session.updateMany.mockResolvedValue({ count: 0 });
    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
  it("uses current roles and binds the session to its user", async () => {
    expect((await strategy.validate(payload)).roles).toEqual(["CUSTOMER"]);
    expect(prisma.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "session", userId: "user", isActive: true },
      }),
    );
  });
  it("fails closed when session storage is unavailable", async () => {
    prisma.session.updateMany.mockRejectedValue(
      new Error("database unavailable"),
    );
    await expect(strategy.validate(payload)).rejects.toThrow(
      "database unavailable",
    );
  });
  it("rejects malformed identities before database access", async () => {
    await expect(
      strategy.validate({ ...payload, sub: "someone-else" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
