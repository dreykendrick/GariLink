import assert from "node:assert/strict";
import {test} from "node:test";
import {
  createGoogleRoutesProvider,
  publicRouteResult,
  RouteService,
  validateRouteRequest,
} from "../functions/garilink-api/route_service.ts";
import type {RouteProvider} from "../functions/garilink-api/route_service.ts";

const request = {
  origin: {latitude: -6.7924, longitude: 39.2083},
  destination: {latitude: -6.8781, longitude: 39.2026},
  travelMode: "DRIVING" as const,
};

test("route request validation separates missing and malformed coordinates", () => {
  assert.equal((validateRouteRequest({destination: request.destination}) as any).status, "INCOMPLETE_INPUT");
  assert.equal((validateRouteRequest({origin: request.origin}) as any).status, "INCOMPLETE_INPUT");
  assert.equal((validateRouteRequest({...request, origin: {latitude: 91, longitude: 39}}) as any).status, "INVALID_ROUTE_INPUT");
  assert.equal((validateRouteRequest({...request, destination: {latitude: -6, longitude: 181}}) as any).status, "INVALID_ROUTE_INPUT");
  assert.deepEqual(validateRouteRequest(request), request);
});

test("Google adapter maps metres and seconds without geometry or floating conversion", async () => {
  const provider = createGoogleRoutesProvider("secret", async (_url, init) => {
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("X-Goog-FieldMask"), "routes.distanceMeters,routes.duration");
    assert.equal((JSON.parse(init?.body as string)).travelMode, "DRIVE");
    return Response.json({routes: [{distanceMeters: 12450, duration: "901s"}]});
  });
  const value = await provider.resolveRoute(request);
  assert.equal(value.status, "ROUTE_AVAILABLE");
  assert.equal(value.routeDistanceMeters, 12450);
  assert.equal(value.routeDurationSeconds, 901);
  assert.equal(JSON.stringify(publicRouteResult(value)).includes("GOOGLE"), false);
});

test("provider no-route, rate-limit, failure, timeout and malformed responses are canonical", async () => {
  const responses: Array<Response | Error> = [
    Response.json({routes: []}),
    Response.json({}, {status: 429}),
    Response.json({}, {status: 503}),
    new DOMException("timeout", "TimeoutError"),
    Response.json({routes: [{distanceMeters: -1, duration: "x"}]}),
  ];
  const statuses = ["NO_ROUTE", "RATE_LIMITED", "PROVIDER_UNAVAILABLE", "PROVIDER_TIMEOUT", "PROVIDER_UNAVAILABLE"];
  for (let index = 0; index < responses.length; index++) {
    const provider = createGoogleRoutesProvider("secret", async () => {
      const value = responses[index];
      if (value instanceof Error) throw value;
      return value;
    });
    assert.equal((await provider.resolveRoute(request)).status, statuses[index]);
  }
});

test("deterministic provider result preserves route metres for Pricing V1 input", async () => {
  const provider: RouteProvider = {identity: "GOOGLE_ROUTES", async resolveRoute(value) {
    assert.deepEqual(value, request);
    return {status: "ROUTE_AVAILABLE", routeCalculationVersion: 1, travelMode: "DRIVING", routeDistanceMeters: 12500, routeDurationSeconds: 900, provider: "GOOGLE_ROUTES", calculatedAt: "2026-09-22T00:00:00Z"};
  }};
  const first = await new RouteService(provider).resolve(request);
  const second = await new RouteService(provider).resolve(request);
  assert.equal(first.routeDistanceMeters, 12500);
  assert.equal(second.routeDistanceMeters, 12500);
  assert.deepEqual({startDate: "2027-01-01", endDate: "2027-01-02", routeDistanceMeters: first.routeDistanceMeters},
    {startDate: "2027-01-01", endDate: "2027-01-02", routeDistanceMeters: 12500});
});

test("unconfigured service never fabricates straight-line distance", async () => {
  const value = await new RouteService().resolve(request);
  assert.equal(value.status, "PROVIDER_UNAVAILABLE");
  assert.equal(value.routeDistanceMeters, undefined);
});
