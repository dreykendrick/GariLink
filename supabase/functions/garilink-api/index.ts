import { createApi } from "./handler.ts";

Deno.serve(
  createApi({
    supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
    anonKey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    serviceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    googleRoutesApiKey: Deno.env.get("GOOGLE_ROUTES_API_KEY") ?? "",
    origins: (Deno.env.get("CORS_ORIGINS") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  }),
);
