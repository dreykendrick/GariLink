import { Webhook } from "npm:standardwebhooks@1.0.0";
import { createSmsHook } from "./handler.ts";
import { createSmsLedger } from "./ledger.ts";

const hookSecret = Deno.env.get("SEND_SMS_HOOK_SECRET");
if (!hookSecret) throw new Error("SEND_SMS_HOOK_SECRET must be configured");
const webhook = new Webhook(hookSecret.replace(/^v1,/, ""));

Deno.serve(
  createSmsHook(
    (body, headers) => webhook.verify(body, headers),
    {
      apiKey: Deno.env.get("BEEM_API_KEY") ?? "",
      secretKey: Deno.env.get("BEEM_SECRET_KEY") ?? "",
      senderId: Deno.env.get("BEEM_SENDER_ID") ?? "",
    },
    fetch,
    createSmsLedger(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    ),
  ),
);
