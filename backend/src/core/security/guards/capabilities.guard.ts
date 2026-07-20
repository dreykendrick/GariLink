import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CAPABILITIES_KEY } from '../decorators/capabilities.decorator';
import { CapabilityType, CapabilityStatus } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { AccessJwtPayload } from '../token.service';

@Injectable()
export class CapabilitiesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredCapabilities = this.reflector.getAllAndOverride<
      CapabilityType[]
    >(CAPABILITIES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredCapabilities || requiredCapabilities.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user: AccessJwtPayload }>();
    const user = request.user;

    if (!user) return false;

    // ADMIN role bypasses capability checks
    if (user.roles.includes('ADMIN')) return true;

    const activeCapabilities = await this.prisma.userCapability.findMany({
      where: {
        userId: user.userId,
        type: { in: requiredCapabilities },
        status: CapabilityStatus.ACTIVE,
      },
      select: { type: true },
    });

    const activeTypes = new Set(activeCapabilities.map((c) => c.type));
    return requiredCapabilities.every((cap) => activeTypes.has(cap));
  }
}
