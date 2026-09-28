import { sendBeemOtp, type BeemConfig } from "../_shared/beem.ts";
import type { SmsLedger } from "./ledger.ts";

type Verify = (body: string, headers: Record<string, string>) => unknown;

export function createSmsHook(
  verify: Verify,
  config: BeemConfig,
  fetcher: typeof fetch,
  ledger: SmsLedger,
) {
  return async (request: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    if (request.method !== "POST")
      return new Response(null, { status: 405, headers: { Allow: "POST" } });
    // Body is verified exactly as received, before parsing or contacting Beem.
    if (Number(request.headers.get("content-length")) > 16384) {
      return new Response(null, { status: 413 });
    }
    const reader = request.body?.getReader();
    if (!reader) return new Response(null, { status: 400 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 16384) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    let event: { user?: { phone?: unknown }; sms?: { otp?: unknown } };
    try {
      event = verify(
        new TextDecoder("utf-8", { fatal: true }).decode(bytes),
        Object.fromEntries(request.headers),
      ) as typeof event;
      if (!event || typeof event !== "object") throw new Error("Invalid event");
    } catch {
      return new Response(null, { status: 401 });
    }
    try {
      const id = request.headers.get("webhook-id") ?? "";
      if (!id || id.length > 200) throw new Error("Invalid message ID");
      const delivery = await ledger.claim(id);
      if (delivery === "ACCEPTED") return Response.json({});
      // A previous isolate may have sent before crashing. Do not send twice.
      if (delivery !== "NEW") throw new Error("Delivery outcome is uncertain");
      await sendBeemOtp(config, event.user?.phone, event.sms?.otp, fetcher);
      await ledger.accept(id);
      return Response.json({});
    } catch {
      console.error(JSON.stringify({
        event: "beem_sms_delivery_failed",
        requestId,
      }));
      return Response.json(
        {
          error: {
            http_code: 503,
            message:
              "We could not send your verification code. Please try again shortly.",
          },
        },
        { status: 503 },
      );
    }
  };
}
