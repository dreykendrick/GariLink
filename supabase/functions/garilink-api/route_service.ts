export type RouteStatus =
  | "ROUTE_AVAILABLE"
  | "INCOMPLETE_INPUT"
  | "INVALID_ROUTE_INPUT"
  | "NO_ROUTE"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_UNAVAILABLE"
  | "RATE_LIMITED";

export type TravelMode = "DRIVING";

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteRequest {
  origin: RoutePoint;
  destination: RoutePoint;
  travelMode: TravelMode;
}

export interface RouteResult {
  status: RouteStatus;
  routeCalculationVersion: 1;
  travelMode: TravelMode;
  routeDistanceMeters?: number;
  routeDurationSeconds?: number;
  calculatedAt?: string;
  provider?: "GOOGLE_ROUTES";
  failureCategory?: string;
}

export interface RouteProvider {
  readonly identity: "GOOGLE_ROUTES";
  resolveRoute(request: RouteRequest): Promise<RouteResult>;
}

const result = (status: RouteStatus, failureCategory?: string): RouteResult => ({
  status,
  routeCalculationVersion: 1,
  travelMode: "DRIVING",
  ...(failureCategory ? {failureCategory} : {}),
});

export function validateRouteRequest(input: unknown): RouteRequest | RouteResult {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return result("INCOMPLETE_INPUT", "ROUTE_POINTS_REQUIRED");
  const body = input as Record<string, unknown>;
  if (Object.keys(body).some((key) => !["origin", "destination", "travelMode"].includes(key)))
    return result("INVALID_ROUTE_INPUT", "UNSUPPORTED_FIELD");
  if (!body.origin || !body.destination)
    return result("INCOMPLETE_INPUT", !body.origin ? "PICKUP_REQUIRED" : "DESTINATION_REQUIRED");
  if ((body.travelMode ?? "DRIVING") !== "DRIVING")
    return result("INVALID_ROUTE_INPUT", "UNSUPPORTED_TRAVEL_MODE");
  const point = (value: unknown): RoutePoint | null => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (Object.keys(record).some((key) => !["latitude", "longitude"].includes(key)) ||
      typeof record.latitude !== "number" || !Number.isFinite(record.latitude) ||
      typeof record.longitude !== "number" || !Number.isFinite(record.longitude) ||
      record.latitude < -90 || record.latitude > 90 ||
      record.longitude < -180 || record.longitude > 180) return null;
    return {latitude: record.latitude, longitude: record.longitude};
  };
  const origin = point(body.origin), destination = point(body.destination);
  if (!origin || !destination) return result("INVALID_ROUTE_INPUT", "INVALID_COORDINATES");
  return {origin, destination, travelMode: "DRIVING"};
}

function durationSeconds(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+(?:\.\d+)?s$/.test(value)) return null;
  const seconds = Math.round(Number(value.slice(0, -1)));
  return Number.isSafeInteger(seconds) && seconds >= 0 && seconds <= 604800 ? seconds : null;
}

export function createGoogleRoutesProvider(
  apiKey: string,
  fetcher: typeof fetch = fetch,
  timeoutMs = 6000,
): RouteProvider {
  return {
    identity: "GOOGLE_ROUTES",
    async resolveRoute(request) {
      let response: Response;
      try {
        response = await fetcher("https://routes.googleapis.com/directions/v2:computeRoutes", {
          method: "POST",
          signal: AbortSignal.timeout(timeoutMs),
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
          },
          body: JSON.stringify({
            origin: {location: {latLng: request.origin}},
            destination: {location: {latLng: request.destination}},
            travelMode: "DRIVE",
            routingPreference: "TRAFFIC_UNAWARE",
          }),
        });
      } catch (error) {
        return result(error instanceof DOMException && error.name === "TimeoutError" ? "PROVIDER_TIMEOUT" : "PROVIDER_UNAVAILABLE", "UPSTREAM_CONNECTION");
      }
      if (response.status === 429) return result("RATE_LIMITED", "UPSTREAM_RATE_LIMIT");
      if (!response.ok) return result("PROVIDER_UNAVAILABLE", `UPSTREAM_HTTP_${response.status}`);
      const payload = await response.json().catch(() => null) as any;
      if (!payload || !Array.isArray(payload.routes)) return result("PROVIDER_UNAVAILABLE", "MALFORMED_RESPONSE");
      if (payload.routes.length === 0) return result("NO_ROUTE", "NO_PROVIDER_ROUTE");
      const route = payload.routes[0];
      const distance = route?.distanceMeters;
      const duration = durationSeconds(route?.duration);
      if (!Number.isSafeInteger(distance) || distance < 0 || distance > 10000000 || duration == null)
        return result("PROVIDER_UNAVAILABLE", "MALFORMED_RESPONSE");
      return {
        status: "ROUTE_AVAILABLE",
        routeCalculationVersion: 1,
        travelMode: "DRIVING",
        routeDistanceMeters: distance,
        routeDurationSeconds: duration,
        calculatedAt: new Date().toISOString(),
        provider: "GOOGLE_ROUTES",
      };
    },
  };
}

export class RouteService {
  private readonly provider?: RouteProvider;

  constructor(provider?: RouteProvider) {
    this.provider = provider;
  }

  async resolve(input: unknown): Promise<RouteResult> {
    const validated = validateRouteRequest(input);
    if ("status" in validated) return validated;
    if (!this.provider) return result("PROVIDER_UNAVAILABLE", "PROVIDER_NOT_CONFIGURED");
    return this.provider.resolveRoute(validated);
  }
}

export function publicRouteResult(value: RouteResult) {
  return {
    status: value.status,
    routeCalculationVersion: value.routeCalculationVersion,
    travelMode: value.travelMode,
    ...(value.routeDistanceMeters == null ? {} : {routeDistanceMeters: value.routeDistanceMeters}),
    ...(value.routeDurationSeconds == null ? {} : {routeDurationSeconds: value.routeDurationSeconds}),
    ...(value.calculatedAt == null ? {} : {calculatedAt: value.calculatedAt}),
    ...(value.failureCategory == null ? {} : {failureCategory: value.failureCategory}),
  };
}
