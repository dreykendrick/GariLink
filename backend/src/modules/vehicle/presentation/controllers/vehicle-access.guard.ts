import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../shared/infrastructure/prisma.service";
import { assertWorkspaceAccess } from "../../../../core/security/workspace-access";
import {
  NotFoundError,
  UnauthorizedError,
} from "../../../../core/errors/app-error";

@Injectable()
export class VehicleAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    if (!userId) throw new UnauthorizedError();
    // Resource path wins over caller-controlled body values on update/read.
    let workspaceId = request.params?.workspaceId;
    if (request.params?.id) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: request.params.id },
        select: { workspaceId: true },
      });
      if (!vehicle) throw new NotFoundError("Vehicle not found");
      workspaceId = vehicle.workspaceId;
    } else if (!workspaceId && request.method === "POST") {
      workspaceId = request.body?.workspaceId;
    }
    if (typeof workspaceId !== "string" || !workspaceId)
      throw new NotFoundError("Workspace not found");
    await assertWorkspaceAccess(
      this.prisma,
      userId,
      workspaceId,
      !["GET", "HEAD"].includes(request.method),
    );
    return true;
  }
}
