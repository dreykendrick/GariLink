import assert from "node:assert/strict";
import {test} from "node:test";
import {createApi} from "../functions/garilink-api/handler.ts";
import type {RouteProvider} from "../functions/garilink-api/route_service.ts";

const config = {supabaseUrl: "https://project.supabase.co", anonKey: "public-key", origins: []};
const body = {origin: {latitude: -6.7924, longitude: 39.2083}, destination: {latitude: -6.8781, longitude: 39.2026}, travelMode: "DRIVING"};
const request = (value: unknown = body, token = "renter-token") => new Request(`${config.supabaseUrl}/functions/v1/garilink-api/v2/routes/resolve`, {
  method: "POST", headers: {"Content-Type": "application/json", ...(token ? {Authorization: `Bearer ${token}`} : {})}, body: JSON.stringify(value),
});
const provider: RouteProvider = {identity: "GOOGLE_ROUTES", async resolveRoute() {
  return {status: "ROUTE_AVAILABLE", routeCalculationVersion: 1, travelMode: "DRIVING", routeDistanceMeters: 12450, routeDurationSeconds: 901, provider: "GOOGLE_ROUTES", calculatedAt: "2026-09-22T00:00:00Z"};
}};
const authFetcher = async (url: URL | RequestInfo) => {
  assert.ok(String(url).endsWith("/auth/v1/user"));
  return Response.json({id: "renter"});
};

test("route endpoint requires legitimate authentication and hides provider identity", async () => {
  const api = createApi(config, authFetcher as typeof fetch, provider);
  assert.equal((await api(request(body, ""))).status, 401);
  const response = await api(request());
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.routeDistanceMeters, 12450);
  assert.equal(JSON.stringify(result).includes("GOOGLE"), false);
});

test("route endpoint rejects malformed input before provider use", async () => {
  let calls = 0;
  const noCall: RouteProvider = {identity: "GOOGLE_ROUTES", async resolveRoute() { calls++; return provider.resolveRoute(body as any); }};
  const api = createApi(config, authFetcher as typeof fetch, noCall);
  const result = await (await api(request({origin: {latitude: 91, longitude: 39}, destination: body.destination}))).json();
  assert.equal(result.status, "INVALID_ROUTE_INPUT");
  assert.equal(calls, 0);
  assert.doesNotMatch(JSON.stringify(result), /latitude|longitude|provider/i);
});

test("route endpoint applies a bounded per-session abuse window", async () => {
  const api = createApi(config, authFetcher as typeof fetch, provider);
  for (let index = 0; index < 6; index++) assert.equal((await api(request())).status, 200);
  assert.equal((await api(request())).status, 429);
});

test("estimate endpoint accepts intent only and uses service-only authoritative calculation", async () => {
  const calls: Array<{url: string; body: any; authorization: string | null}> = [];
  const api = createApi({...config, serviceRoleKey: "service-secret"}, async (url, init) => {
    if (String(url).endsWith("/auth/v1/user")) return Response.json({id: "renter-id"});
    const item = {url: String(url), body: JSON.parse(init?.body as string), authorization: new Headers(init?.headers).get("authorization")};
    calls.push(item);
    if (item.url.endsWith("/garilink_rental_estimate_context")) return Response.json({configured: true, requiresRoute: false});
    assert.equal(item.authorization, "Bearer service-secret");
    return Response.json({status: "ESTIMATED", estimateVersion: 1, finalEstimatedAmountMinor: 240000});
  });
  const intent = {listingId: "11111111-1111-4111-8111-111111111111", startDate: "2027-01-01", endDate: "2027-01-04"};
  const response = await api(new Request(`${config.supabaseUrl}/functions/v1/garilink-api/v2/rentals/estimate`, {
    method: "POST", headers: {"Content-Type": "application/json", Authorization: "Bearer renter-token"}, body: JSON.stringify(intent),
  }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).finalEstimatedAmountMinor, 240000);
  assert.deepEqual(calls[1].body, {p_actor_id: "renter-id", p_listing_id: intent.listingId,
    p_start_date: intent.startDate, p_end_date: intent.endDate, p_route_result: null});
});

test("estimate endpoint rejects client totals and route distances", async () => {
  const api = createApi({...config, serviceRoleKey: "service-secret"}, authFetcher as typeof fetch, provider);
  for (const extra of [{finalEstimatedAmountMinor: 1}, {routeDistanceMeters: 1}, {components: {baseChargeMinor: 1}}]) {
    const response = await api(new Request(`${config.supabaseUrl}/functions/v1/garilink-api/v2/rentals/estimate`, {
      method: "POST", headers: {"Content-Type": "application/json", Authorization: "Bearer renter-token"},
      body: JSON.stringify({listingId: "11111111-1111-4111-8111-111111111111", startDate: "2027-01-01", endDate: "2027-01-02", ...extra}),
    }));
    assert.equal(response.status, 400);
  }
});
