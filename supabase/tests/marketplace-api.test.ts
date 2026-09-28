import assert from "node:assert/strict";
import { test } from "node:test";
import { createApi } from "../functions/garilink-api/handler.ts";

const config = {
  supabaseUrl: "https://project.supabase.co",
  anonKey: "public-key",
  origins: [],
};
const id = "11111111-1111-4111-8111-111111111111";
test("public RPCs support legacy anon JWTs without misusing publishable keys", async () => {
  for (const key of ["eyJtest.anon.jwt", "sb_publishable_test"]) {
    const api = createApi({ ...config, anonKey: key }, async (_url, init) => {
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("apikey"), key);
      assert.equal(
        headers.get("authorization"),
        key.startsWith("eyJ") ? `Bearer ${key}` : null,
      );
      return Response.json({ data: [], total: 0 });
    });
    assert.equal((await api(request("/listings"))).status, 200);
  }
});
function request(path: string, method = "GET", body?: unknown, token?: string) {
  return new Request(
    `https://project.supabase.co/functions/v1/garilink-api${path}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
  );
}

test("public listing search forwards only bounded-contract filters without a service credential", async () => {
  const api = createApi(config, async (url, init) => {
    assert.equal(
      String(url),
      `${config.supabaseUrl}/rest/v1/rpc/garilink_search_listings`,
    );
    assert.equal(new Headers(init?.headers).get("authorization"), null);
    assert.equal(new Headers(init?.headers).get("apikey"), "public-key");
    assert.deepEqual(JSON.parse(init?.body as string), {
      filters: {
        q: "Toyota",
        priceMax: "90000",
        type: "FOR_HIRE",
        transmission: "AUTOMATIC",
        fuelType: "PETROL",
        sort: "PRICE_ASC",
      },
    });
    return Response.json({ data: [], total: 0 });
  });
  assert.equal(
    (await api(request("/listings?q=Toyota&priceMax=90000&type=FOR_HIRE&transmission=AUTOMATIC&fuelType=PETROL&sort=PRICE_ASC")))
      .status,
    200,
  );
  assert.equal((await api(request("/listings?status=DRAFT"))).status, 400);
  assert.equal((await api(request("/listings?page=1&page=2"))).status, 400);
});

test("search rejects client-only or unknown marketplace controls", async () => {
  const api = createApi(config, async () => {
    assert.fail("Invalid filters must not reach the database");
  });
  assert.equal((await api(request("/listings?status=PUBLISHED"))).status, 400);
  assert.equal((await api(request("/listings?ownerPhone=255700000000"))).status, 400);
});

test("public details hide unpublished records and sanitize database errors", async () => {
  const api = createApi(config, async () =>
    Response.json(
      { code: "PT404", message: "private database detail" },
      { status: 404 },
    ),
  );
  const response = await api(request(`/listings/${id}`));
  assert.equal(response.status, 404);
  assert.equal((await response.text()).includes("private database"), false);
});

test("marketplace responses replace private storage paths with signed URLs", async () => {
  const api = createApi({ ...config, serviceRoleKey: "service-secret" }, async (url, init) => {
    if (String(url).includes("/storage/v1/object/sign/vehicle-media/")) {
      assert.equal(new Headers(init?.headers).get("authorization"), "Bearer service-secret");
      assert.equal(new Headers(init?.headers).get("apikey"), "service-secret");
      return Response.json({ signedURL: "/object/sign/vehicle-media/signed-token" });
    }
    return Response.json({
      id,
      vehicle: {
        images: [{
          media: {
            id: "media-id",
            storagePath: "workspace/vehicle/private.jpg",
          },
        }],
      },
    });
  });
  const response = await api(request(`/listings/${id}`));
  assert.equal(response.status, 200);
  const text = await response.text();
  assert.equal(text.includes("storagePath"), false);
  assert.equal(text.includes("workspace/vehicle/private.jpg"), false);
  assert.equal(text.includes("signed-token"), true);
  assert.equal(text.includes("/storage/v1/object/sign/vehicle-media/signed-token"), true);
});

test("draft creation forwards the caller identity and complete atomic payload", async () => {
  const payload = {
    requestId: id,
    workspaceId: id,
    vehicle: { make: "Toyota" },
  };
  const api = createApi(config, async (url, init) => {
    assert.equal(
      new Headers(init?.headers).get("authorization"),
      "Bearer owner",
    );
    if (String(url).endsWith("/auth/v1/user"))
      return Response.json({ id: "owner" });
    assert.equal(
      String(url),
      `${config.supabaseUrl}/rest/v1/rpc/garilink_create_draft`,
    );
    assert.deepEqual(JSON.parse(init?.body as string), { input: payload });
    return Response.json({ id, status: "DRAFT" });
  });
  const response = await api(
    request("/listings/drafts", "POST", payload, "owner"),
  );
  assert.equal(response.status, 201);
  assert.equal((await response.json()).status, "DRAFT");
});

test("listing edits use the path identity and authenticated update RPC", async () => {
  const patch = { title: "Updated Toyota", price: 47000000 };
  const api = createApi(config, async (url, init) => {
    if (String(url).endsWith("/auth/v1/user")) return Response.json({ id: "owner" });
    assert.equal(String(url), `${config.supabaseUrl}/rest/v1/rpc/garilink_update_listing`);
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer owner");
    assert.deepEqual(JSON.parse(init?.body as string), { listing_id: id, patch });
    return Response.json({ id, ...patch, status: "DRAFT" });
  });
  const response = await api(request(`/listings/${id}`, "PATCH", patch, "owner"));
  assert.equal(response.status, 200);
});

test("inventory, saves and mutations require sign-in before any upstream request", async () => {
  const api = createApi(config, async () => {
    assert.fail("No upstream request expected");
  });
  for (const [path, method] of [
    ["/listings/mine", "GET"],
    ["/listings/saved", "GET"],
    ["/listings/drafts", "POST"],
    [`/listings/${id}/publish`, "POST"],
    [`/listings/${id}`, "PATCH"],
    [`/listings/${id}/save`, "DELETE"],
    [`/vehicles/${id}`, "GET"],
    [`/vehicles/workspace/${id}`, "GET"],
  ])
    assert.equal((await api(request(path, method))).status, 401);
});

test("save and unsave are explicit desired states and ignore spoofed body targets", async () => {
  for (const method of ["POST", "DELETE"]) {
    const api = createApi(config, async (url, init) => {
      if (String(url).endsWith("/auth/v1/user"))
        return Response.json({ id: "customer" });
      assert.equal(
        new Headers(init?.headers).get("authorization"),
        "Bearer customer",
      );
      assert.equal(
        String(url),
        `${config.supabaseUrl}/rest/v1/rpc/garilink_save_listing`,
      );
      assert.deepEqual(JSON.parse(init?.body as string), {
        listing_id: id,
        saved: method === "POST",
      });
      return Response.json({ saved: method === "POST" });
    });
    const response = await api(
      request(
        `/listings/${id}/save`,
        method,
        { listing_id: "spoofed", user_id: "another-user" },
        "customer",
      ),
    );
    assert.equal(response.status, 200);
    assert.equal((await response.json()).saved, method === "POST");
  }
});

test("listing state conflicts return 409 without leaking SQL details", async () => {
  const api = createApi(config, async (url, init) => {
    if (String(url).endsWith("/auth/v1/user"))
      return Response.json({ id: "owner" });
    assert.deepEqual(JSON.parse(init?.body as string), {
      listing_id: id,
      action: "publish",
    });
    return Response.json(
      { code: "PT409", message: "private details" },
      { status: 409 },
    );
  });
  const response = await api(
    request(
      `/listings/${id}/publish`,
      "POST",
      { workspaceId: "spoof" },
      "owner",
    ),
  );
  assert.equal(response.status, 409);
  assert.equal((await response.text()).includes("private details"), false);
});

test("owner inventory routes dispatch to their scoped RPCs, never the public detail RPC", async () => {
  for (const [path, rpc, input] of [
    ["/listings/mine", "garilink_my_listings", {}],
    ["/listings/saved", "garilink_saved_listings", {}],
    [`/vehicles/${id}`, "garilink_vehicle", { vehicle_id: id }],
    [
      `/vehicles/workspace/${id}`,
      "garilink_workspace_vehicles",
      { workspace_id: id },
    ],
  ] as const) {
    const api = createApi(config, async (url, init) => {
      if (String(url).endsWith("/auth/v1/user"))
        return Response.json({ id: "owner" });
      assert.equal(String(url), `${config.supabaseUrl}/rest/v1/rpc/${rpc}`);
      assert.deepEqual(JSON.parse(init?.body as string), input);
      return Response.json({ data: [] });
    });
    assert.equal(
      (await api(request(path, "GET", undefined, "owner"))).status,
      200,
    );
  }
});
