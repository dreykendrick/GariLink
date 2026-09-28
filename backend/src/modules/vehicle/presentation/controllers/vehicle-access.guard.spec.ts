import { ExecutionContext } from "@nestjs/common";
import { VehicleAccessGuard } from "./vehicle-access.guard";
import {
  ForbiddenError,
  UnauthorizedError,
} from "../../../../core/errors/app-error";

describe("VehicleAccessGuard", () => {
  function setup(request: object, found: object | null = { id: "workspace" }) {
    const prisma = {
      workspace: { findFirst: jest.fn().mockResolvedValue(found) },
      vehicle: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ workspaceId: "actual-workspace" }),
      },
    };
    const guard = new VehicleAccessGuard(prisma as any);
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    return { prisma, guard, context };
  }

  it("requires an authenticated actor", async () => {
    const { guard, context, prisma } = setup({ method: "GET" });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(prisma.workspace.findFirst).not.toHaveBeenCalled();
  });

  it("checks actual vehicle workspace rather than a spoofed request body", async () => {
    const { guard, context, prisma } = setup({
      user: { userId: "actor" },
      method: "PATCH",
      params: { id: "vehicle" },
      body: { workspaceId: "attacker-workspace" },
    });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.workspace.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "actual-workspace",
          isActive: true,
        }),
      }),
    );
    const query = prisma.workspace.findFirst.mock.calls[0][0];
    expect(query.where.OR[1].members.some).toEqual({
      userId: "actor",
      status: "ACTIVE",
      role: { in: ["OWNER", "MANAGER"] },
    });
  });

  it("denies workspace access when no ownership or eligible membership exists", async () => {
    const { guard, context } = setup(
      {
        user: { userId: "actor" },
        method: "POST",
        body: { workspaceId: "other" },
      },
      null,
    );
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("allows read membership but still requires active membership and workspace", async () => {
    const { guard, context, prisma } = setup({
      user: { userId: "actor" },
      method: "GET",
      params: { workspaceId: "workspace" },
    });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(
      prisma.workspace.findFirst.mock.calls[0][0].where.OR[1].members.some,
    ).toEqual({ userId: "actor", status: "ACTIVE" });
  });
});
