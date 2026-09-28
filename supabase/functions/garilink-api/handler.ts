import {createGoogleRoutesProvider, publicRouteResult, RouteService} from "./route_service.ts";
import type {RouteProvider} from "./route_service.ts";

interface ApiConfig {
  supabaseUrl: string;
  anonKey: string;
  origins: string[];
  serviceRoleKey?: string;
  googleRoutesApiKey?: string;
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function textField(
  body: Record<string, unknown>,
  key: string,
  max: number,
  required = true,
): string {
  const value = body[key];
  if (!required && value == null) return "";
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  ) {
    throw new HttpError(400, `Enter a valid ${key}.`);
  }
  return value;
}

function phoneField(body: Record<string, unknown>): string {
  let phone = textField(body, "phoneNumber", 24)
    .trim()
    .replace(/[\s()-]/g, "");
  if (/^0[67]\d{8}$/.test(phone)) phone = `+255${phone.slice(1)}`;
  else if (/^255[67]\d{8}$/.test(phone)) phone = `+${phone}`;
  if (!/^\+255[67]\d{8}$/.test(phone))
    throw new HttpError(400, "Enter a valid Tanzanian mobile number.");
  return phone;
}

function passwordField(
  body: Record<string, unknown>,
  key = "password",
): string {
  const password = textField(body, key, 128);
  if (password.length < 10)
    throw new HttpError(400, "Use a password with at least 10 characters.");
  return password;
}

async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new HttpError(415, "Send a JSON request.");
  }
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Request body is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 16384) {
      await reader.cancel();
      throw new HttpError(413, "Request is too large.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    const body = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error();
    return body;
  } catch {
    throw new HttpError(400, "Request body is not valid JSON.");
  }
}

export function createApi(config: ApiConfig, fetcher: typeof fetch = fetch, routeProvider?: RouteProvider) {
  const upstream = new URL(config.supabaseUrl);
  if (
    upstream.protocol !== "https:" &&
    !["localhost", "127.0.0.1", "kong"].includes(upstream.hostname)
  ) {
    throw new Error("Supabase must use HTTPS outside local development");
  }
  if (!config.anonKey) throw new Error("Supabase public API key is required");
  const routeService = new RouteService(routeProvider ?? (config.googleRoutesApiKey
    ? createGoogleRoutesProvider(config.googleRoutesApiKey, fetcher)
    : undefined));
  const routeWindows = new Map<string, {started: number; count: number}>();

  async function call(
    path: string,
    method: string,
    body?: unknown,
    token?: string,
  ) {
    let response: Response;
    // Legacy local-stack anon keys are JWTs. Publishable keys belong only in
    // apikey; never put sb_publishable_* keys in a Bearer header.
    const bearer =
      token ??
      (path.startsWith("/rest/v1/") && config.anonKey.startsWith("eyJ")
        ? config.anonKey
        : undefined);
    try {
      response = await fetcher(new URL(path, upstream), {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(8000),
        headers: {
          apikey: token === config.serviceRoleKey && config.serviceRoleKey
            ? config.serviceRoleKey
            : config.anonKey,
          "Content-Type": "application/json",
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new HttpError(
        503,
        "Connection unavailable. Please try again shortly.",
      );
    }
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      if (response.status === 429)
        throw new HttpError(
          429,
          "Too many attempts. Please wait before trying again.",
        );
      if (response.status >= 500)
        throw new HttpError(
          503,
          "Service unavailable. Please try again shortly.",
        );
      // Only allowlisted codes affect user messages. Never forward provider bodies.
      if (detail?.error_code === "phone_not_confirmed")
        throw new HttpError(403, "Verify your phone number before signing in.");
      if (
        [
          "refresh_token_not_found",
          "refresh_token_already_used",
          "session_not_found",
          "session_expired",
        ].includes(detail?.error_code)
      ) {
        throw new HttpError(
          401,
          "Your session has expired. Please sign in again.",
        );
      }
      if (response.status === 401)
        throw new HttpError(
          401,
          "Your session has expired. Please sign in again.",
        );
      if (response.status === 403 || detail?.code === "42501")
        throw new HttpError(
          403,
          "You do not have permission to perform this action.",
        );
      if (detail?.code === "23505")
        throw new HttpError(409, "This record already exists.");
      if (response.status === 404 || detail?.code === "PT404")
        throw new HttpError(404, "This item is no longer available.");
      if (response.status === 409 || detail?.code === "PT409")
        throw new HttpError(
          409,
          "This item has changed. Refresh and try again.",
        );
      throw new HttpError(
        400,
        "Check your details or verification code and try again.",
      );
    }
    if (response.status === 204) return null;
    const raw = await response.text();
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      throw new HttpError(
        503,
        "Service unavailable. Please try again shortly.",
      );
    }
  }

  async function sessionResult(session: Record<string, any>) {
    if (
      !session?.access_token ||
      !session?.refresh_token ||
      !session?.user?.id
    ) {
      throw new HttpError(
        503,
        "Sign-in could not be completed. Please try again.",
      );
    }
    let user;
    try {
      user = await call(
        "/rest/v1/rpc/garilink_me",
        "POST",
        {},
        session.access_token,
      );
    } catch (error) {
      if (!(error instanceof HttpError) || error.status !== 503) throw error;
      // Preserve a successfully created/rotated session during a profile outage.
      // Safe fallback grants no owner/admin capability; /me must refresh it later.
      user = {
        id: session.user.id,
        phoneNumber: "+" + String(session.user.phone ?? "").replace(/^\+/, ""),
        email: session.user.email || null,
        isPhoneVerified: !!session.user.phone_confirmed_at,
        isEmailVerified: !!session.user.email_confirmed_at,
        roles: ["CUSTOMER"],
        capabilities: [],
        profile: null,
      };
    }
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
      user,
    };
  }

  async function withSignedMedia(value: any): Promise<any> {
    if (!value) return value;
    const paths = new Set<string>();
    const collect = (node: any) => {
      if (Array.isArray(node)) return node.forEach(collect);
      if (!node || typeof node !== "object") return;
      if (typeof node.storagePath === "string") paths.add(node.storagePath);
      Object.values(node).forEach(collect);
    };
    collect(value);
    const signed = new Map<string, string>();
    if (config.serviceRoleKey)
      await Promise.all([...paths].map(async (path) => {
        const result = await call(
          `/storage/v1/object/sign/vehicle-media/${path.split("/").map(encodeURIComponent).join("/")}`,
          "POST",
          { expiresIn: 3600 },
          config.serviceRoleKey,
        );
        if (typeof result?.signedURL === "string")
          signed.set(path, new URL(
            result.signedURL.replace(/^\/?(?:storage\/v1\/)?/, ""),
            new URL("/storage/v1/", upstream),
          ).toString());
      }));
    const attach = (node: any) => {
      if (Array.isArray(node)) return node.forEach(attach);
      if (!node || typeof node !== "object") return;
      if (typeof node.storagePath === "string") {
        if (signed.has(node.storagePath))
          node.publicUrl = signed.get(node.storagePath);
        delete node.storagePath;
      }
      Object.values(node).forEach(attach);
    };
    attach(value);
    return value;
  }

  return async (request: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const origin = request.headers.get("origin");
    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Request-Id": requestId,
      Vary: "Origin",
    });
    if (origin) {
      if (!config.origins.includes(origin))
        return Response.json(
          { message: "Origin not allowed." },
          { status: 403, headers },
        );
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set(
        "Access-Control-Allow-Headers",
        "authorization, apikey, content-type, x-client-info",
      );
      headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, DELETE, OPTIONS",
      );
    }
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    const url = new URL(request.url);
    const path =
      url.pathname.replace(/^\/(?:functions\/v1\/)?garilink-api(?=\/|$)/, "") ||
      "/";
      const route = `${request.method} ${path}`;
    const ok = (data: unknown, status = 200) =>
      Response.json(data, { status, headers });
    try {
      if (route === "GET /health")
        return ok({
          status: "ok",
          backend: "supabase",
          paymentMode: "OFF_PLATFORM",
        });
      if (route === "POST /auth/register") {
        const body = await jsonBody(request);
        const phone = phoneField(body);
        await call("/auth/v1/signup", "POST", {
          phone,
          password: passwordField(body),
          data: {
            firstName: textField(body, "firstName", 80, false).trim(),
            lastName: textField(body, "lastName", 80, false).trim(),
          },
        });
        return ok({ requiresVerification: true, phoneNumber: phone }, 202);
      }
      if (route === "POST /auth/login") {
        const body = await jsonBody(request);
        const identifier = textField(body, "identifier", 254).trim();
        const credentials = identifier.includes("@")
          ? { email: identifier }
          : { phone: phoneField({ phoneNumber: identifier }) };
        return ok(
          await sessionResult(
            await call("/auth/v1/token?grant_type=password", "POST", {
              ...credentials,
              password: textField(body, "password", 128),
            }),
          ),
        );
      }
      if (route === "POST /auth/refresh") {
        const body = await jsonBody(request);
        const result = await call(
          "/auth/v1/token?grant_type=refresh_token",
          "POST",
          { refresh_token: textField(body, "refreshToken", 4096) },
        );
        if (!result?.access_token || !result?.refresh_token)
          throw new HttpError(503, "Session refresh failed. Please try again.");
        return ok({
          accessToken: result.access_token,
          refreshToken: result.refresh_token,
        });
      }
      if (route === "POST /auth/otp/request") {
        const body = await jsonBody(request);
        if (body.purpose !== "PHONE_VERIFICATION")
          throw new HttpError(400, "Invalid verification purpose.");
        await call("/auth/v1/resend", "POST", {
          phone: phoneField(body),
          type: "sms",
        });
        return ok({
          message: "If verification is needed, a code has been sent.",
        });
      }
      if (route === "POST /auth/otp/verify") {
        const body = await jsonBody(request);
        const code = textField(body, "code", 6);
        if (body.purpose !== "PHONE_VERIFICATION" || !/^\d{6}$/.test(code))
          throw new HttpError(400, "Enter the six-digit verification code.");
        const session = await call("/auth/v1/verify", "POST", {
          phone: phoneField(body),
          token: code,
          type: "sms",
        });
        return ok({ ...(await sessionResult(session)), verified: true });
      }
      if (route === "POST /auth/password/forgot") {
        const body = await jsonBody(request);
        try {
          await call("/auth/v1/otp", "POST", {
            phone: phoneField(body),
            create_user: false,
          });
        } catch (error) {
          if (
            !(error instanceof HttpError) ||
            ![400, 403, 404].includes(error.status)
          )
            throw error;
        }
        return ok({
          message: "If this account exists, a verification code has been sent.",
        });
      }
      if (route === "POST /auth/password/reset") {
        const body = await jsonBody(request);
        const phone = phoneField(body),
          password = passwordField(body, "newPassword"),
          code = textField(body, "otpCode", 6);
        if (!/^\d{6}$/.test(code))
          throw new HttpError(400, "Enter the six-digit verification code.");
        const session = await call("/auth/v1/verify", "POST", {
          phone,
          token: code,
          type: "sms",
        });
        if (!session?.access_token)
          throw new HttpError(
            400,
            "Verification failed. Please request a new code.",
          );
        await call("/auth/v1/user", "PUT", { password }, session.access_token);
        await call(
          "/auth/v1/logout?scope=global",
          "POST",
          undefined,
          session.access_token,
        );
        return ok({
          message: "Password updated. Sign in with your new password.",
        });
      }
      const uuid =
        "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
      const listingPath = new RegExp(`^/listings/(${uuid})$`, "i").exec(path);
      if (route === "GET /listings") {
        const filters: Record<string, string> = {};
        for (const [key, value] of url.searchParams) {
          if (
            ![
              "page",
              "limit",
              "q",
              "county",
              "type",
              "priceMin",
              "priceMax",
              "transmission",
              "fuelType",
              "sort",
            ].includes(key) ||
            key in filters
          )
            throw new HttpError(400, "Invalid search filters.");
          filters[key] = value;
        }
        return ok(
          await withSignedMedia(await call("/rest/v1/rpc/garilink_search_listings", "POST", {
            filters,
          })),
        );
      }
      if (route === "GET /v2/vehicles/discoverable")
        return ok(await withSignedMedia(await call(
          "/rest/v1/rpc/garilink_v2_discoverable_vehicles", "POST", {},
        )));
      if (route === "GET /v2/vehicles/nearby") {
        const allowed = new Set(["lat", "lng", "radiusMeters", "limit", "offset"]);
        const params: Record<string, string> = {};
        for (const [key, value] of url.searchParams) {
          if (!allowed.has(key) || key in params) throw new HttpError(400, "Invalid nearby search.");
          params[key] = value;
        }
        const number = (key: string, fallback?: number) => {
          const raw = params[key];
          if (raw == null && fallback != null) return fallback;
          if (raw == null || !/^-?\d+(\.\d+)?$/.test(raw)) throw new HttpError(400, "Enter a valid nearby search.");
          const value = Number(raw);
          if (!Number.isFinite(value)) throw new HttpError(400, "Enter a valid nearby search.");
          return value;
        };
        const lat = number("lat"), lng = number("lng");
        const radiusMeters = number("radiusMeters", 10000);
        const limit = number("limit", 20), offset = number("offset", 0);
        if (!Number.isInteger(radiusMeters) || !Number.isInteger(limit) || !Number.isInteger(offset))
          throw new HttpError(400, "Enter a valid nearby search.");
        return ok(await withSignedMedia(await call(
          "/rest/v1/rpc/garilink_v2_nearby_vehicles", "POST",
          { p_latitude: lat, p_longitude: lng, p_radius_meters: radiusMeters, p_limit: limit, p_offset: offset },
        )));
      }
      if (route === "POST /v2/vehicles/match") {
        const body = await jsonBody(request);
        const allowed = new Set(["searchLocation", "transportNeed", "radiusMeters", "limit", "offset"]);
        for (const key of Object.keys(body)) {
          if (!allowed.has(key)) throw new HttpError(400, "Invalid matching request.");
        }
        const location = body.searchLocation;
        const need = body.transportNeed;
        if (!location || typeof location !== "object" || Array.isArray(location) || !need || typeof need !== "object" || Array.isArray(need))
          throw new HttpError(400, "Enter a valid transport need and search location.");
        const record = location as Record<string, unknown>;
        if (Object.keys(record).some((key) => !["latitude", "longitude"].includes(key)) ||
          typeof record.latitude !== "number" || !Number.isFinite(record.latitude) ||
          typeof record.longitude !== "number" || !Number.isFinite(record.longitude))
          throw new HttpError(400, "Enter a valid transport need and search location.");
        const boundedInteger = (key: string, fallback: number) => {
          const value = body[key] ?? fallback;
          if (typeof value !== "number" || !Number.isInteger(value)) throw new HttpError(400, "Invalid matching request.");
          return value;
        };
        return ok(await withSignedMedia(await call(
          "/rest/v1/rpc/garilink_v2_matched_vehicles", "POST", {
            p_latitude: record.latitude, p_longitude: record.longitude,
            p_transport_need: need,
            p_radius_meters: boundedInteger("radiusMeters", 10000),
            p_limit: boundedInteger("limit", 20), p_offset: boundedInteger("offset", 0),
          },
        )));
      }
      if (listingPath && request.method === "GET")
        return ok(
          await withSignedMedia(await call("/rest/v1/rpc/garilink_listing", "POST", {
            listing_id: listingPath[1],
          })),
        );
      const listingAction = new RegExp(
        `^/listings/(${uuid})/(publish|pause|archive|save)$`,
        "i",
      ).exec(path);
      const rentalPath = new RegExp(`^/rentals/(${uuid})/cancel$`, "i").exec(
        path,
      );
      const ownerRentalsPath = new RegExp(
        `^/owner/workspaces/(${uuid})/rentals$`,
        "i",
      ).exec(path);
      const ownerRentalAction = new RegExp(
        `^/owner/workspaces/(${uuid})/rentals/(${uuid})/(approve|reject|ready|start|complete)$`,
        "i",
      ).exec(path);
      const mediaPath = new RegExp(`^/media/(${uuid})$`, "i").exec(path);
      const vehiclePath = new RegExp(`^/vehicles/(${uuid})$`, "i").exec(path);
      const v2VehiclePath = new RegExp(`^/v2/vehicles/(${uuid})$`, "i").exec(path);
      const v2EligibilityPath = new RegExp(`^/v2/vehicles/(${uuid})/eligibility$`, "i").exec(path);
      const v2PublicationPath = new RegExp(`^/v2/vehicles/(${uuid})/publication$`, "i").exec(path);
      const v2LocationPath = new RegExp(`^/v2/vehicles/(${uuid})/location$`, "i").exec(path);
      const v2PricingPath = new RegExp(`^/v2/vehicles/(${uuid})/pricing$`, "i").exec(path);
      const inventoryPath = new RegExp(
        `^/vehicles/workspace/(${uuid})$`,
        "i",
      ).exec(path);
      const privateRoutes = new Set([
        "GET /me",
        "POST /profile",
        "POST /auth/logout",
        "GET /workspaces",
        "POST /workspaces",
        "POST /listings/drafts",
        "POST /v2/vehicles/drafts",
        "GET /listings/mine",
        "GET /listings/saved",
        "GET /rentals",
        "POST /rentals",
        "POST /media/reserve",
        "POST /media/finalize",
        "POST /media/reorder",
        "PATCH /v2/vehicles",
        "PATCH /v2/vehicles/location",
        "POST /v2/routes/resolve",
        "POST /v2/rentals/estimate",
      ]);
      const workspacePath = /^\/workspaces\/([0-9a-f-]{36})$/i.exec(path);
      if (
        !privateRoutes.has(route) &&
        !(listingPath && request.method === "PATCH") &&
        !(workspacePath && ["GET", "PATCH"].includes(request.method)) &&
        !(
          listingAction &&
          (request.method === "POST" ||
            (request.method === "DELETE" && listingAction[2] === "save"))
        ) &&
        !(rentalPath && request.method === "PATCH") &&
        !(ownerRentalsPath && request.method === "GET") &&
        !(ownerRentalAction && request.method === "PATCH") &&
        !(mediaPath && request.method === "DELETE") &&
        !(v2VehiclePath && request.method === "PATCH") &&
        !(v2EligibilityPath && request.method === "GET") &&
        !(v2PublicationPath && request.method === "POST") &&
        !(v2LocationPath && ["GET", "PATCH"].includes(request.method)) &&
        !(v2PricingPath && ["GET", "PATCH"].includes(request.method)) &&
        !((vehiclePath || inventoryPath) && request.method === "GET")
      )
        throw new HttpError(404, "Endpoint not found.");
      const match = /^Bearer ([^\s]+)$/i.exec(
        request.headers.get("authorization") ?? "",
      );
      if (!match) throw new HttpError(401, "Please sign in to continue.");
      const token = match[1];
      const authenticatedUser = await call("/auth/v1/user", "GET", undefined, token);
      if (route === "POST /v2/routes/resolve") {
        const now = Date.now();
        const key = token.slice(-24);
        const window = routeWindows.get(key);
        if (!window || now - window.started >= 60000) routeWindows.set(key, {started: now, count: 1});
        else if (++window.count > 6) throw new HttpError(429, "Too many route requests. Please wait before trying again.");
        const started = performance.now();
        const routeResult = await routeService.resolve(await jsonBody(request));
        console.info(JSON.stringify({event: "garilink_route_resolved", requestId, status: routeResult.status,
          providerCategory: routeResult.provider ?? "NOT_CONFIGURED", latencyMs: Math.round(performance.now() - started)}));
        return ok(publicRouteResult(routeResult));
      }
      if (route === "POST /v2/rentals/estimate") {
        const body = await jsonBody(request);
        const allowed = new Set(["listingId", "startDate", "endDate", "pickupLocation", "destinationLocation"]);
        if (Object.keys(body).some((key) => !allowed.has(key)) ||
          typeof body.listingId !== "string" || typeof body.startDate !== "string" || typeof body.endDate !== "string" ||
          !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(body.startDate) || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(body.endDate))
          throw new HttpError(400, "Enter valid rental dates and vehicle.");
        const context = await call("/rest/v1/rpc/garilink_rental_estimate_context", "POST", {
          p_listing_id: body.listingId, p_start_date: body.startDate.slice(0, 10), p_end_date: body.endDate.slice(0, 10),
        }, token);
        let routeResult: unknown = null;
        if (context.requiresRoute === true) {
          const point = (value: unknown) => {
            if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
            const record = value as Record<string, unknown>;
            return {latitude: record.latitude, longitude: record.longitude};
          };
          routeResult = await routeService.resolve({origin: point(body.pickupLocation),
            destination: point(body.destinationLocation), travelMode: "DRIVING"});
        }
        if (!config.serviceRoleKey) throw new HttpError(503, "Estimate service is unavailable. Please try again shortly.");
        return ok(await call("/rest/v1/rpc/garilink_calculate_rental_estimate", "POST", {
          p_actor_id: authenticatedUser.id, p_listing_id: body.listingId,
          p_start_date: body.startDate.slice(0, 10), p_end_date: body.endDate.slice(0, 10),
          p_route_result: routeResult,
        }, config.serviceRoleKey));
      }
      if (v2VehiclePath && request.method === "PATCH")
        return ok(await withSignedMedia(await call(
          "/rest/v1/rpc/garilink_v2_update_vehicle", "POST", {
            vehicle_id: v2VehiclePath[1], patch: await jsonBody(request),
          }, token,
        )));
      if (v2EligibilityPath)
        return ok(await call("/rest/v1/rpc/garilink_v2_vehicle_eligibility", "POST", {
          vehicle_id: v2EligibilityPath[1],
        }, token));
      if (v2PublicationPath && request.method === "POST") {
        const body = await jsonBody(request);
        return ok(await withSignedMedia(await call(
          "/rest/v1/rpc/garilink_v2_set_publication", "POST", {
            vehicle_id: v2PublicationPath[1],
            action: textField(body, "action", 16),
          }, token,
        )));
      }
      if (v2LocationPath && request.method === "PATCH")
        return ok(await call(
          "/rest/v1/rpc/garilink_v2_update_vehicle_location", "POST",
          { target_vehicle_id: v2LocationPath[1], location: await jsonBody(request) }, token));
      if (v2LocationPath && request.method === "GET")
        return ok(await call("/rest/v1/rpc/garilink_v2_vehicle_location", "POST",
          { p_vehicle_id: v2LocationPath[1] }, token));
      if (v2PricingPath && request.method === "GET")
        return ok(await call("/rest/v1/rpc/garilink_vehicle_rental_pricing", "POST",
          { p_vehicle_id: v2PricingPath[1] }, token));
      if (v2PricingPath && request.method === "PATCH")
        return ok(await call("/rest/v1/rpc/garilink_update_vehicle_rental_pricing", "POST",
          { p_vehicle_id: v2PricingPath[1], p_policy: await jsonBody(request) }, token));
      if (listingPath && request.method === "PATCH")
        return ok(await withSignedMedia(await call(
          "/rest/v1/rpc/garilink_update_listing", "POST", {
            listing_id: listingPath[1], patch: await jsonBody(request),
          }, token)));
      if (route === "POST /media/reserve") {
        const body = await jsonBody(request);
        const reservation = await call(
          "/rest/v1/rpc/garilink_reserve_vehicle_media",
          "POST",
          {
            vehicle_id: textField(body, "vehicleId", 36),
            mime_type: textField(body, "mimeType", 32),
          },
          token,
        );
        return ok({
          id: reservation.id,
          position: reservation.position,
          isCover: reservation.isCover,
          uploadUrl: new URL(
            `/storage/v1/object/vehicle-media/${reservation.storagePath.split("/").map(encodeURIComponent).join("/")}`,
            upstream,
          ).toString(),
          apiKey: config.anonKey,
        }, 201);
      }
      if (route === "POST /media/finalize") {
        const body = await jsonBody(request);
        return ok(await withSignedMedia(await call(
          "/rest/v1/rpc/garilink_finalize_vehicle_media", "POST", {
            media_id: textField(body,"mediaId",36),
            byte_size: body.byteSize,
            width: body.width,
            height: body.height,
          }, token)));
      }
      if (route === "POST /media/reorder") {
        const body = await jsonBody(request);
        if (!Array.isArray(body.mediaIds) || body.mediaIds.length > 10)
          throw new HttpError(400,"Provide a valid photo order.");
        return ok(await withSignedMedia(await call("/rest/v1/rpc/garilink_reorder_vehicle_media","POST",{
          vehicle_id:textField(body,"vehicleId",36), media_ids:body.mediaIds,
        },token)));
      }
      if (mediaPath && request.method === "DELETE") {
        const ticket = await call("/rest/v1/rpc/garilink_vehicle_media_delete_ticket","POST",{media_id:mediaPath[1]},token);
        try {
          await call(`/storage/v1/object/vehicle-media/${ticket.storagePath.split("/").map(encodeURIComponent).join("/")}`,"DELETE",undefined,token);
        } catch (error) {
          if (!(error instanceof HttpError) || error.status !== 404) throw error;
        }
        const deleted = await call("/rest/v1/rpc/garilink_vehicle_media_delete","POST",{media_id:mediaPath[1]},token);
        return ok({ id: deleted.id, deleted: deleted.deleted === true });
      }
      if (route === "POST /rentals")
        return ok(
          await call(
            "/rest/v1/rpc/garilink_create_rental",
            "POST",
            { input: await jsonBody(request) },
            token,
          ),
          201,
        );
      if (route === "GET /rentals")
        return ok(
          await call("/rest/v1/rpc/garilink_my_rentals", "POST", {}, token),
        );
      if (rentalPath)
        return ok(
          await call(
            "/rest/v1/rpc/garilink_cancel_rental",
            "POST",
            { rental_id: rentalPath[1] },
            token,
          ),
        );
      if (ownerRentalsPath)
        return ok(
          await call(
            "/rest/v1/rpc/garilink_workspace_rentals",
            "POST",
            { workspace_id: ownerRentalsPath[1] },
            token,
          ),
        );
      if (ownerRentalAction) {
        const body =
          ownerRentalAction[3] === "reject" ? await jsonBody(request) : {};
        return ok(
          await call(
            "/rest/v1/rpc/garilink_rental_action",
            "POST",
            {
              workspace_id: ownerRentalAction[1],
              rental_id: ownerRentalAction[2],
              action: ownerRentalAction[3],
              reason:
                ownerRentalAction[3] === "reject"
                  ? textField(body, "reason", 500)
                  : null,
            },
            token,
          ),
        );
      }
      if (route === "POST /listings/drafts")
        return ok(
          await call(
            "/rest/v1/rpc/garilink_create_draft",
            "POST",
            { input: await jsonBody(request) },
            token,
          ),
          201,
        );
      if (route === "POST /v2/vehicles/drafts")
        return ok(
          await withSignedMedia(await call(
            "/rest/v1/rpc/garilink_v2_create_vehicle_draft",
            "POST",
            { input: await jsonBody(request) },
            token,
          )),
          201,
        );
      if (route === "GET /listings/mine" || route === "GET /listings/saved")
        return ok(
          await withSignedMedia(await call(
            `/rest/v1/rpc/${route.endsWith("mine") ? "garilink_my_listings" : "garilink_saved_listings"}`,
            "POST",
            {},
            token,
          )),
        );
      if (listingAction) {
        const saving = listingAction[2] === "save";
        return ok(
          await call(
            `/rest/v1/rpc/${saving ? "garilink_save_listing" : "garilink_listing_status"}`,
            "POST",
            {
              listing_id: listingAction[1],
              ...(saving
                ? { saved: request.method === "POST" }
                : { action: listingAction[2] }),
            },
            token,
          ),
        );
      }
      if (vehiclePath || inventoryPath)
        return ok(
          await call(
            `/rest/v1/rpc/${vehiclePath ? "garilink_vehicle" : "garilink_workspace_vehicles"}`,
            "POST",
            vehiclePath
              ? { vehicle_id: vehiclePath[1] }
              : { workspace_id: inventoryPath![1] },
            token,
          ),
        );
      if (route === "GET /workspaces")
        return ok(
          await call("/rest/v1/rpc/garilink_workspaces", "POST", {}, token),
        );
      if (route === "POST /workspaces")
        return ok(
          await call(
            "/rest/v1/rpc/garilink_create_workspace",
            "POST",
            { input: await jsonBody(request) },
            token,
          ),
          201,
        );
      if (workspacePath) {
        const rpc =
          request.method === "GET"
            ? "garilink_workspace"
            : "garilink_update_workspace";
        return ok(
          await call(
            `/rest/v1/rpc/${rpc}`,
            "POST",
            {
              workspace_id: workspacePath[1],
              ...(request.method === "PATCH"
                ? { patch: await jsonBody(request) }
                : {}),
            },
            token,
          ),
        );
      }
      if (route === "GET /me")
        return ok(await call("/rest/v1/rpc/garilink_me", "POST", {}, token));
      if (route === "POST /profile")
        return ok(
          await call(
            "/rest/v1/rpc/garilink_update_profile",
            "POST",
            { patch: await jsonBody(request) },
            token,
          ),
        );
      await call("/auth/v1/logout?scope=local", "POST", undefined, token);
      return new Response(null, { status: 204, headers });
    } catch (error) {
      console.error(JSON.stringify({
        event: "garilink_api_request_failed",
        requestId,
        route,
        status: error instanceof HttpError ? error.status : 500,
        errorType: error instanceof Error ? error.name : "UnknownError",
      }));
      return ok(
        {
          message:
            error instanceof HttpError
              ? error.message
              : "An unexpected error occurred. Please try again.",
        },
        error instanceof HttpError ? error.status : 500,
      );
    }
  };
}
