import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { TokenService } from "./token.service";

describe("TokenService refresh credentials", () => {
  it("issues distinct refresh tokens even within the same second", () => {
    const service = new TokenService(
      new JwtService(),
      new ConfigService({
        app: {
          jwt: {
            refreshSecret: "test-only-refresh-secret",
            refreshExpiresIn: "7d",
          },
        },
      }),
    );
    const payload = {
      userId: "user",
      sessionId: "session",
      familyId: "family",
    };
    const tokens = Array.from({ length: 10 }, () =>
      service.generateRefreshToken(payload),
    );
    expect(new Set(tokens).size).toBe(10);
    expect(service.verifyRefreshToken(tokens[0])).toMatchObject(payload);
  });
});
