import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../shared/infrastructure/prisma.service";
import { AccessJwtPayload } from "../token.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("app.jwt.accessSecret"),
    });
  }

  async validate(payload: AccessJwtPayload): Promise<AccessJwtPayload> {
    if (
      !payload.userId ||
      !payload.sessionId ||
      payload.sub !== payload.userId
    ) {
      throw new UnauthorizedException("Please sign in again");
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true, roles: { select: { role: true } } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Account not found or inactive");
    }

    // Validate and touch the active session atomically. A signed JWT alone is
    // insufficient after logout, password reset, or administrative revocation.
    const session = await this.prisma.session.updateMany({
      where: { id: payload.sessionId, userId: payload.userId, isActive: true },
      data: { lastActiveAt: new Date() },
    });
    if (session.count !== 1) {
      throw new UnauthorizedException(
        "Your session has ended. Please sign in again",
      );
    }

    return { ...payload, roles: user.roles.map((record) => record.role) };
  }
}
