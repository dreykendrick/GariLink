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
export declare class TokenService {
    private readonly jwtService;
    private readonly configService;
    constructor(jwtService: JwtService, configService: ConfigService);
    generateAccessToken(payload: {
        userId: string;
        roles: string[];
        sessionId: string;
    }): string;
    generateRefreshToken(payload: {
        userId: string;
        sessionId: string;
        familyId: string;
    }): string;
    verifyAccessToken(token: string): AccessJwtPayload | null;
    verifyRefreshToken(token: string): RefreshJwtPayload | null;
}
