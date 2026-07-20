import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface AccessJwtPayload {
  sub: string;
  userId: string;
  roles: string[];
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface RefreshJwtPayload {
  sub: string;
  userId: string;
  sessionId: string;
  familyId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(payload: {
    userId: string;
    roles: string[];
    sessionId: string;
  }): string {
    return this.jwtService.sign(
      {
        sub: payload.userId,
        userId: payload.userId,
        roles: payload.roles,
        sessionId: payload.sessionId,
      },
      {
        secret: this.configService.get<string>('app.jwt.accessSecret'),
        expiresIn: this.configService.get<string>('app.jwt.accessExpiresIn'),
      },
    );
  }

  generateRefreshToken(payload: {
    userId: string;
    sessionId: string;
    familyId: string;
  }): string {
    return this.jwtService.sign(
      {
        sub: payload.userId,
        userId: payload.userId,
        sessionId: payload.sessionId,
        familyId: payload.familyId,
      },
      {
        secret: this.configService.get<string>('app.jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('app.jwt.refreshExpiresIn'),
      },
    );
  }

  verifyAccessToken(token: string): AccessJwtPayload | null {
    try {
      return this.jwtService.verify<AccessJwtPayload>(token, {
        secret: this.configService.get<string>('app.jwt.accessSecret'),
      });
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string): RefreshJwtPayload | null {
    try {
      return this.jwtService.verify<RefreshJwtPayload>(token, {
        secret: this.configService.get<string>('app.jwt.refreshSecret'),
      });
    } catch {
      return null;
    }
  }
}
