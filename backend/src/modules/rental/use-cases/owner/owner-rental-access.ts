import { WorkspaceMemberRole, WorkspaceMemberStatus } from "@prisma/client";
import { PrismaService } from "../../../../shared/infrastructure/prisma.service";

const MANAGEMENT_ROLES = [
  WorkspaceMemberRole.OWNER,
  WorkspaceMemberRole.MANAGER,
];

export async function canManageWorkspaceRentals(
  prisma: PrismaService,
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId,
      status: WorkspaceMemberStatus.ACTIVE,
      role: { in: MANAGEMENT_ROLES },
    },
    select: { id: true },
  });
  return member !== null;
}
