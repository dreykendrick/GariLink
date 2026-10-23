import { createApi } from "./handler.ts";

Deno.serve(
  createApi({
    authRedirectUrl: Deno.env.get("GARILINK_AUTH_REDIRECT_URL"),
    supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
    anonKey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    serviceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    googleRoutesApiKey: Deno.env.get("GOOGLE_ROUTES_API_KEY") ?? "",
    identityEvidenceEnabled: Deno.env.get("GARILINK_IDENTITY_EVIDENCE_ENABLED") === "true",
    identityIngestToken: Deno.env.get('GARILINK_IDENTITY_INGEST_TOKEN') ?? '',
    identityReadToken: Deno.env.get('GARILINK_IDENTITY_READ_TOKEN') ?? '',
    origins: (Deno.env.get("CORS_ORIGINS") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  }),
);
