import { canManageWorkspaceRentals } from "./owner-rental-access";

describe("owner rental access", () => {
  it("requires an active owner or manager membership", async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: "membership" });
    const allowed = await canManageWorkspaceRentals(
      { workspaceMember: { findFirst } } as any,
      "workspace",
      "user",
    );

    expect(allowed).toBe(true);
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        workspaceId: "workspace",
        userId: "user",
        status: "ACTIVE",
        role: { in: ["OWNER", "MANAGER"] },
      },
      select: { id: true },
    });
  });

  it("denies users without a qualifying membership", async () => {
    const allowed = await canManageWorkspaceRentals(
      {
        workspaceMember: { findFirst: jest.fn().mockResolvedValue(null) },
      } as any,
      "workspace",
      "viewer",
    );

    expect(allowed).toBe(false);
  });
});
