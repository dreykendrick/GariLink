import { hashRefreshToken } from "./identity.use-cases";

describe("hashRefreshToken", () => {
  it("produces a deterministic lookup digest without storing the credential", () => {
    const token = "a-high-entropy-refresh-token";

    const first = hashRefreshToken(token);
    const second = hashRefreshToken(token);

    expect(first).toBe(second);
    expect(first).not.toContain(token);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces different digests for different tokens", () => {
    expect(hashRefreshToken("token-a")).not.toBe(hashRefreshToken("token-b"));
  });
});
