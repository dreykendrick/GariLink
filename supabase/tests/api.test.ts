import assert from "node:assert/strict";
import { test } from "node:test";
import { createApi } from "../functions/garilink-api/handler.ts";

const config = {
  supabaseUrl: "https://project.supabase.co",
  anonKey: "public-test-key",
  origins: ["https://garilink.test"],
};
const session = {
  access_token: "access",
  refresh_token: "refresh",
  expires_in: 900,
  user: {
    id: "auth-user",
    phone: "255712345678",
    phone_confirmed_at: "2026-09-08T00:00:00Z",
  },
};
const me = {
  id: "auth-user",
  phoneNumber: "+255712345678",
  roles: ["CUSTOMER"],
  capabilities: [],
  profile: { firstName: "Juma" },
};
function request(path: string, body?: unknown, token?: string) {
  return new Request(
    `https://project.supabase.co/functions/v1/garilink-api${path}`,
    {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
  );
}

test("signup only forwards names and waits for phone verification without issuing fake tokens", async () => {
  const api = createApi(config, async (url, init) => {
    assert.equal(String(url), "https://project.supabase.co/auth/v1/signup");
    const payload = JSON.parse(init?.body as string);
    assert.deepEqual(payload.data, { firstName: "Juma", lastName: "Rashid" });
    assert.equal(payload.role, undefined);
    return Response.json({ user: { id: "pending-user" } });
  });
  const response = await api(
    request("/auth/register", {
      phoneNumber: "+255712345678",
      password: "long-password",
      firstName: " Juma ",
      lastName: "Rashid",
      role: "ADMIN",
      capabilities: ["ADMIN"],
    }),
  );
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), {
    requiresVerification: true,
    phoneNumber: "+255712345678",
  });
});

test("invalid registration data is rejected before contacting Auth", async () => {
  const api = createApi(config, async () => {
    assert.fail("Must not contact upstream");
  });
  for (const body of [
    { phoneNumber: "+254712345678", password: "long-password" },
    { phoneNumber: "+255712345678", password: "short" },
    {
      phoneNumber: "+255712345678",
      password: "long-password",
      firstName: "x".repeat(81),
    },
  ]) {
    assert.equal((await api(request("/auth/register", body))).status, 400);
  }
});

test("verified login returns real tokens and caller-scoped profile", async () => {
  const api = createApi(config, async (url, init) => {
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("apikey"), config.anonKey);
    if (String(url).includes("/auth/v1/token")) return Response.json(session);
    assert.equal(
      String(url),
      "https://project.supabase.co/rest/v1/rpc/garilink_me",
    );
    assert.equal(headers.get("Authorization"), "Bearer access");
    return Response.json(me);
  });
  const response = await api(
    request("/auth/login", {
      identifier: "+255712345678",
      password: "long-password",
    }),
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).user.profile.firstName, "Juma");
});

test("profile outage after login preserves tokens but grants no owner privilege", async () => {
  const api = createApi(config, async (url) =>
    String(url).includes("/token")
      ? Response.json(session)
      : new Response("private database failure", { status: 500 }),
  );
  const response = await api(
    request("/auth/login", {
      identifier: "+255712345678",
      password: "long-password",
    }),
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.accessToken, "access");
  assert.deepEqual(body.user.roles, ["CUSTOMER"]);
  assert.deepEqual(body.user.capabilities, []);
});

test("profile authorization failure does not return a successful login", async () => {
  const api = createApi(config, async (url) =>
    String(url).includes("/token")
      ? Response.json(session)
      : Response.json({ code: "42501" }, { status: 403 }),
  );
  const response = await api(
    request("/auth/login", {
      identifier: "+255712345678",
      password: "long-password",
    }),
  );
  assert.equal(response.status, 403);
  assert.equal((await response.json()).accessToken, undefined);
});

test("private routes require online Auth verification and never accept an actor from the body", async () => {
  let calls = 0;
  const api = createApi(config, async (url, init) => {
    calls++;
    assert.equal(String(url), "https://project.supabase.co/auth/v1/user");
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      "Bearer forged",
    );
    return Response.json({ message: "sensitive error" }, { status: 401 });
  });
  assert.equal((await api(request("/me"))).status, 401);
  assert.equal(calls, 0);
  assert.equal(
    (
      await api(
        request(
          "/profile",
          { userId: "victim", firstName: "attacker" },
          "forged",
        ),
      )
    ).status,
    401,
  );
  assert.equal(calls, 1);
});

test("refresh forwards rotated tokens and maps revoked refresh to 401", async () => {
  const api = createApi(config, async () => Response.json(session));
  const response = await api(
    request("/auth/refresh", { refreshToken: "old-refresh" }),
  );
  assert.deepEqual(await response.json(), {
    accessToken: "access",
    refreshToken: "refresh",
  });
  const revoked = createApi(config, async () =>
    Response.json({ error_code: "refresh_token_not_found" }, { status: 400 }),
  );
  assert.equal(
    (await revoked(request("/auth/refresh", { refreshToken: "revoked" })))
      .status,
    401,
  );
});

test("rate limits and provider failures are sanitized", async () => {
  for (const status of [429, 500]) {
    const api = createApi(
      config,
      async () => new Response("private secret detail", { status }),
    );
    const result = await api(
      request("/auth/login", {
        identifier: "+255712345678",
        password: "long-password",
      }),
    );
    assert.equal(result.status, status === 500 ? 503 : status);
    assert.doesNotMatch(await result.text(), /private secret/);
  }
});

test("OTP verification returns a session and rejects unsupported purposes", async () => {
  const api = createApi(config, async (url) =>
    String(url).includes("/verify")
      ? Response.json(session)
      : Response.json(me),
  );
  const result = await api(
    request("/auth/otp/verify", {
      phoneNumber: "+255712345678",
      code: "123456",
      purpose: "PHONE_VERIFICATION",
    }),
  );
  assert.equal((await result.json()).verified, true);
  assert.equal(
    (
      await api(
        request("/auth/otp/verify", {
          phoneNumber: "+255712345678",
          code: "123456",
          purpose: "ADMIN",
        }),
      )
    ).status,
    400,
  );
});

test("CORS permits exact configured origin and rejects untrusted origins", async () => {
  const api = createApi(config);
  for (const origin of [
    "https://garilink.test",
    "https://garilink.test.attacker.test",
  ]) {
    const result = await api(
      new Request("https://project.supabase.co/garilink-api/health", {
        headers: { Origin: origin },
      }),
    );
    assert.equal(result.status, origin === config.origins[0] ? 200 : 403);
    assert.equal(
      result.headers.get("Access-Control-Allow-Origin"),
      origin === config.origins[0] ? origin : null,
    );
  }
});

test("unknown endpoint never pretends an unimplemented feature succeeded", async () => {
  const result = await createApi(config)(request("/vehicles"));
  assert.equal(result.status, 404);
});

test("workspace creation uses the caller token and returns the RPC result", async () => {
  const api = createApi(config, async (url, init) => {
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      "Bearer workspace-user",
    );
    if (String(url).endsWith("/auth/v1/user"))
      return Response.json({ id: "workspace-user" });
    assert.equal(
      String(url),
      "https://project.supabase.co/rest/v1/rpc/garilink_create_workspace",
    );
    assert.deepEqual(JSON.parse(init?.body as string), {
      input: { name: "Juma Motors", type: "PERSONAL", requestId: "request-id" },
    });
    return Response.json({
      id: "workspace",
      name: "Juma Motors",
      isVerified: false,
    });
  });
  const result = await api(
    request(
      "/workspaces",
      { name: "Juma Motors", type: "PERSONAL", requestId: "request-id" },
      "workspace-user",
    ),
  );
  assert.equal(result.status, 201);
  assert.equal((await result.json()).id, "workspace");
});

test("workspace update never replaces the path ID with a supplied body ID", async () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const api = createApi(config, async (url, init) => {
    if (String(url).endsWith("/auth/v1/user"))
      return Response.json({ id: "actor" });
    assert.equal(JSON.parse(init?.body as string).workspace_id, id);
    return Response.json({ code: "42501" }, { status: 403 });
  });
  const result = await api(
    new Request(`https://example.test/garilink-api/workspaces/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer actor",
      },
      body: JSON.stringify({
        workspace_id: "attacker-workspace",
        name: "Changed",
      }),
    }),
  );
  assert.equal(result.status, 403);
});
