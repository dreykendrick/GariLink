import assert from "node:assert/strict";
import { test } from "node:test";
import { createApi } from "../functions/garilink-api/handler.ts";

const config = { supabaseUrl: "https://project.supabase.co", anonKey: "publishable", origins: [] };
const vehicle = "11111111-1111-4111-8111-111111111111";
const media = "22222222-2222-4222-8222-222222222222";
function req(path: string, method = "POST", body?: unknown, token = "user") {
  return new Request(`https://project.supabase.co/functions/v1/garilink-api${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test("media mutations require an online authenticated session", async () => {
  const api = createApi(config, async () => assert.fail("must not call upstream"));
  for (const [path, method] of [["/media/reserve","POST"],["/media/finalize","POST"],["/media/reorder","POST"],[`/media/${media}`,"DELETE"]]) {
    assert.equal((await api(req(path, method, method === "DELETE" ? undefined : {}, ""))).status, 401);
  }
});

test("reservation returns only the exact server-generated upload target", async () => {
  const storagePath = `workspace/${vehicle}/${media}.jpg`;
  const api = createApi(config, async (url, init) => {
    if (String(url).endsWith("/auth/v1/user")) return Response.json({ id: "owner" });
    assert.ok(String(url).endsWith("/rpc/garilink_reserve_vehicle_media"));
    assert.deepEqual(JSON.parse(init?.body as string), { vehicle_id: vehicle, mime_type: "image/jpeg" });
    return Response.json({ id: media, storagePath });
  });
  const response = await api(req("/media/reserve", "POST", { vehicleId: vehicle, mimeType: "image/jpeg", storagePath: "forged" }));
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.apiKey, "publishable");
  assert.equal(body.uploadUrl, `https://project.supabase.co/storage/v1/object/vehicle-media/${storagePath}`);
});

test("reorder bounds input and forwards no spoofed workspace", async () => {
  const calls: any[] = [];
  const api = createApi(config, async (url, init) => {
    if (String(url).endsWith("/auth/v1/user")) return Response.json({ id: "owner" });
    calls.push(JSON.parse(init?.body as string));
    return Response.json([]);
  });
  assert.equal((await api(req("/media/reorder", "POST", { vehicleId: vehicle, mediaIds: [media], workspaceId: "forged" }))).status, 200);
  assert.deepEqual(calls[0], { vehicle_id: vehicle, media_ids: [media] });
  assert.equal((await api(req("/media/reorder", "POST", { vehicleId: vehicle, mediaIds: Array(11).fill(media) }))).status, 400);
});

test("delete authorizes the path before Storage and database removal", async () => {
  const order: string[] = [];
  const api = createApi(config, async (url) => {
    const value = String(url);
    if (value.endsWith("/auth/v1/user")) return Response.json({ id: "owner" });
    if (value.includes("delete_ticket")) { order.push("authorize"); return Response.json({ id: media, storagePath: `w/v/${media}.jpg` }); }
    if (value.includes("/storage/v1/object/")) { order.push("storage"); return new Response(null, { status: 204 }); }
    order.push("database"); return Response.json({ deleted: true });
  });
  assert.equal((await api(req(`/media/${media}`, "DELETE"))).status, 200);
  assert.deepEqual(order, ["authorize", "storage", "database"]);
});
