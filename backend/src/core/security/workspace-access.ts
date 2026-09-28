import { PrismaService } from "../../shared/infrastructure/prisma.service";
import { ForbiddenError } from "../errors/app-error";

export async function assertWorkspaceAccess(
  prisma: Pick<PrismaService, "workspace">,
  userId: string,
  workspaceId: string,
  write = false,
): Promise<void> {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      isActive: true,
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId,
              status: "ACTIVE",
              ...(write
                ? {
                    role: {
                      in: ["OWNER", "MANAGER"] as ("OWNER" | "MANAGER")[],
                    },
                  }
                : {}),
            },
          },
        },
      ],
    },
    select: { id: true },
  });
  if (!workspace)
    throw new ForbiddenError("You do not have access to this workspace.");
}
