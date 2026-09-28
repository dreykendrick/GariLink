import assert from "node:assert/strict";
import { test } from "node:test";
import { createApi } from "../functions/garilink-api/handler.ts";

const config = { supabaseUrl: "https://project.supabase.co", anonKey: "public-key", origins: [] };
const vehicle = "11111111-1111-4111-8111-111111111111";
const request = (path: string, method = "GET", body?: unknown, token?: string) => new Request(
  `${config.supabaseUrl}/functions/v1/garilink-api${path}`, {
    method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  },
);

test("V2 discovery is public and only calls its rental-first RPC", async () => {
  const api = createApi(config, async (url, init) => {
    assert.equal(String(url), `${config.supabaseUrl}/rest/v1/rpc/garilink_v2_discoverable_vehicles`);
    assert.equal(new Headers(init?.headers).get("authorization"), null);
    return Response.json([]);
  });
  assert.equal((await api(request("/v2/vehicles/discoverable"))).status, 200);
});

test("V2 vehicle configuration requires an authenticated owner and forwards only path identity", async () => {
  const calls: unknown[] = [];
  const api = createApi(config, async (url, init) => {
    if (String(url).endsWith("/auth/v1/user")) return Response.json({ id: "owner" });
    calls.push(JSON.parse(init?.body as string));
    return Response.json({ vehicleCategory: "PICKUP", operationalAvailability: "AVAILABLE" });
  });
  const body = { vehicleCategory: "PICKUP", capabilities: { schema_version: 1, payload_kg: 900 } };
  assert.equal((await api(request(`/v2/vehicles/${vehicle}`, "PATCH", body, "owner-token"))).status, 200);
  assert.deepEqual(calls, [{ vehicle_id: vehicle, patch: body }]);
  const denied = await createApi(config, async () => assert.fail("no upstream"))(request(`/v2/vehicles/${vehicle}`, "PATCH", body));
  assert.equal(denied.status, 401);
});

test("eligibility endpoint is authenticated and has a narrow RPC contract", async () => {
  const api = createApi(config, async (url, init) => {
    if (String(url).endsWith("/auth/v1/user")) return Response.json({ id: "owner" });
    assert.ok(String(url).endsWith("/rpc/garilink_v2_vehicle_eligibility"));
    assert.deepEqual(JSON.parse(init?.body as string), { vehicle_id: vehicle });
    return Response.json({ discoverable: true, requestable: false, operationalAvailability: "BUSY" });
  });
  assert.equal((await api(request(`/v2/vehicles/${vehicle}/eligibility`, "GET", undefined, "owner-token"))).status, 200);
});

test("V2 rental draft is authenticated and always uses the dedicated rental-first RPC", async () => {
  const input = {
    workspaceId: vehicle,
    requestId: "22222222-2222-4222-8222-222222222222",
    title: "2024 Isuzu NPR",
    county: "Dar es Salaam",
    price: 200000,
    vehicleCategory: "MEDIUM_TRUCK",
    capabilities: { schema_version: 1, payload_kg: 5000 },
  };
  const api = createApi(config, async (url, init) => {
    if (String(url).endsWith("/auth/v1/user")) return Response.json({ id: "owner" });
    assert.ok(String(url).endsWith("/rpc/garilink_v2_create_vehicle_draft"));
    assert.deepEqual(JSON.parse(init?.body as string), { input });
    return Response.json({ id: "listing" });
  });
  assert.equal((await api(request("/v2/vehicles/drafts", "POST", input, "owner-token"))).status, 201);
});

test("V2 publication action is path-scoped and rejects unauthenticated calls", async () => {
  const api = createApi(config, async (url, init) => {
    if (String(url).endsWith("/auth/v1/user")) return Response.json({ id: "owner" });
    assert.ok(String(url).endsWith("/rpc/garilink_v2_set_publication"));
    assert.deepEqual(JSON.parse(init?.body as string), { vehicle_id: vehicle, action: "publish" });
    return Response.json({ status: "PUBLISHED" });
  });
  assert.equal((await api(request(`/v2/vehicles/${vehicle}/publication`, "POST", { action: "publish" }, "owner-token"))).status, 200);
  const denied = await createApi(config, async () => assert.fail("no upstream"))(request(`/v2/vehicles/${vehicle}/publication`, "POST", { action: "publish" }));
  assert.equal(denied.status, 401);
});

test("rental pricing read and update use authenticated path-scoped RPCs", async () => {
  const policy = {
    policyVersion: 1,
    currency: "TZS",
    baseChargeMinor: 25000,
    minimumChargeMinor: 50000,
    durationRateMinorPerDay: 80000,
    distanceRateMinorPerKilometer: 1500,
  };
  const calls: Array<{ url: string; body: unknown }> = [];
  const api = createApi(config, async (url, init) => {
    if (String(url).endsWith("/auth/v1/user")) return Response.json({ id: "owner" });
    calls.push({ url: String(url), body: JSON.parse(init?.body as string) });
    return Response.json({ configured: true, ...policy });
  });
  assert.equal((await api(request(`/v2/vehicles/${vehicle}/pricing`, "GET", undefined, "owner-token"))).status, 200);
  assert.equal((await api(request(`/v2/vehicles/${vehicle}/pricing`, "PATCH", policy, "owner-token"))).status, 200);
  assert.ok(calls[0].url.endsWith("/rpc/garilink_vehicle_rental_pricing"));
  assert.deepEqual(calls[0].body, { p_vehicle_id: vehicle });
  assert.ok(calls[1].url.endsWith("/rpc/garilink_update_vehicle_rental_pricing"));
  assert.deepEqual(calls[1].body, { p_vehicle_id: vehicle, p_policy: policy });
  const denied = await createApi(config, async () => assert.fail("no upstream"))(
    request(`/v2/vehicles/${vehicle}/pricing`, "PATCH", policy),
  );
  assert.equal(denied.status, 401);
});
