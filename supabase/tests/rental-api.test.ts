import assert from "node:assert/strict";
import { test } from "node:test";
import { createApi } from "../functions/garilink-api/handler.ts";

const config = {
  supabaseUrl: "https://project.supabase.co",
  anonKey: "public-test-key",
  origins: [],
};
const listing = "11111111-1111-4111-8111-111111111111";
const workspace = "22222222-2222-4222-8222-222222222222";
const rental = "33333333-3333-4333-8333-333333333333";
const requestId = "44444444-4444-4444-8444-444444444444";

function req(path: string, method = "GET", body?: unknown, signedIn = true) {
  return new Request(`https://project.supabase.co/functions/v1/garilink-api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(signedIn ? { Authorization: "Bearer user-token" } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test("rental routes require a verified online session", async () => {
  const api = createApi(config, async () => assert.fail("must not call upstream"));
  for (const [path, method] of [
    ["/rentals", "GET"],
    ["/rentals", "POST"],
    [`/rentals/${rental}/cancel`, "PATCH"],
    [`/owner/workspaces/${workspace}/rentals`, "GET"],
    [`/owner/workspaces/${workspace}/rentals/${rental}/approve`, "PATCH"],
  ]) assert.equal((await api(req(path, method, method === "POST" ? {} : undefined, false))).status, 401);
});

test("rental creation forwards only the authenticated request contract", async () => {
  const payload = {
    listingId: listing,
    requestId,
    startDate: "2026-10-01T00:00:00.000Z",
    endDate: "2026-10-03T00:00:00.000Z",
    pickupNotes: "Airport",
    customerId: "spoofed",
    dailyRate: 1,
    status: "APPROVED",
  };
  const api = createApi(config, async (url, init) => {
    if (String(url).endsWith("/auth/v1/user")) return Response.json({ id: "user" });
    assert.ok(String(url).endsWith("/rest/v1/rpc/garilink_create_rental"));
    assert.deepEqual(JSON.parse(init?.body as string), { input: payload });
    return Response.json({ id: rental });
  });
  const response = await api(req("/rentals", "POST", payload));
  assert.equal(response.status, 201);
});

test("owner rental actions use path scope and bounded rejection reason", async () => {
  const calls: Array<{ url: string; body: unknown }> = [];
  const api = createApi(config, async (url, init) => {
    if (String(url).endsWith("/auth/v1/user")) return Response.json({ id: "owner" });
    calls.push({ url: String(url), body: JSON.parse(init?.body as string) });
    return Response.json({ id: rental });
  });
  assert.equal((await api(req(`/owner/workspaces/${workspace}/rentals/${rental}/reject`, "PATCH", {
    reason: "Unavailable",
    workspaceId: "spoofed",
    rentalId: "spoofed",
  }))).status, 200);
  assert.deepEqual(calls[0].body, {
    workspace_id: workspace,
    rental_id: rental,
    action: "reject",
    reason: "Unavailable",
  });
  assert.equal((await api(req(`/owner/workspaces/${workspace}/rentals/${rental}/reject`, "PATCH", {
    reason: "x".repeat(501),
  }))).status, 400);
  assert.equal(calls.length, 1);
});

test("database rental conflicts remain sanitized HTTP 409", async () => {
  const api = createApi(config, async (url) => {
    if (String(url).endsWith("/auth/v1/user")) return Response.json({ id: "owner" });
    return Response.json({ code: "PT409", message: "internal dates" }, { status: 400 });
  });
  const response = await api(req(`/owner/workspaces/${workspace}/rentals/${rental}/approve`, "PATCH"));
  assert.equal(response.status, 409);
  assert.equal((await response.json()).message, "This item has changed. Refresh and try again.");
});

test("customer cancellation uses only the rental path identity", async () => {
  const api = createApi(config, async (url, init) => {
    if (String(url).endsWith("/auth/v1/user")) return Response.json({ id: "customer" });
    assert.ok(String(url).endsWith("/rest/v1/rpc/garilink_cancel_rental"));
    assert.deepEqual(JSON.parse(init?.body as string), { rental_id: rental });
    return Response.json({ id: rental, status: "CANCELLED" });
  });
  assert.equal((await api(req(`/rentals/${rental}/cancel`, "PATCH", { rentalId: "spoofed" }))).status, 200);
});

test("every supported owner lifecycle action is routed without client-forged state", async () => {
  for (const action of ["approve", "ready", "start", "complete"]) {
    const api = createApi(config, async (url, init) => {
      if (String(url).endsWith("/auth/v1/user")) return Response.json({ id: "owner" });
      assert.ok(String(url).endsWith("/rest/v1/rpc/garilink_rental_action"));
      assert.deepEqual(JSON.parse(init?.body as string), { workspace_id: workspace, rental_id: rental, action, reason: null });
      return Response.json({ id: rental });
    });
    assert.equal((await api(req(`/owner/workspaces/${workspace}/rentals/${rental}/${action}`, "PATCH", { status: "COMPLETED" }))).status, 200);
  }
});
