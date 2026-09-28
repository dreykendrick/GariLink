import assert from "node:assert/strict";
import { test } from "node:test";
import { Webhook } from "standardwebhooks";
import {
  beemPhone,
  sendBeemOtp,
  SmsDeliveryError,
} from "../functions/_shared/beem.ts";
import { createSmsHook } from "../functions/beem-sms/handler.ts";
import type { SmsLedger } from "../functions/beem-sms/ledger.ts";

const config = {
  apiKey: "test-key",
  secretKey: "test-secret",
  senderId: "GariLink",
};
const success = () =>
  Response.json({ successful: true, code: 100, valid: 1, invalid: 0 });
const secret = `whsec_${Buffer.from("only-a-test-signing-secret-32bytes").toString("base64")}`;
const webhook = new Webhook(secret);
const event = JSON.stringify({
  user: { phone: "+255712345678" },
  sms: { otp: "123456" },
});

function testLedger(): SmsLedger {
  const entries = new Map<string, boolean>();
  return {
    async claim(id) {
      if (entries.has(id)) return entries.get(id) ? "ACCEPTED" : "UNKNOWN";
      entries.set(id, false);
      return "NEW";
    },
    async accept(id) {
      entries.set(id, true);
    },
  };
}

function signedRequest(body = event, date = new Date(), signedBody = body) {
  const id = "test-message-id";
  return new Request("https://example.test/beem-sms", {
    method: "POST",
    body,
    headers: {
      "webhook-id": id,
      "webhook-timestamp": String(Math.floor(date.getTime() / 1000)),
      "webhook-signature": webhook.sign(id, date, signedBody),
    },
  });
}

test("normalizes international phone and rejects local or malformed numbers", () => {
  assert.equal(beemPhone("+255712345678"), "255712345678");
  assert.equal(beemPhone("255712345678"), "255712345678");
  for (const bad of [
    "0712345678",
    "+255 712345678",
    "x255712345678",
    null,
    "12",
  ]) {
    assert.throws(() => beemPhone(bad));
  }
});

test("Beem send uses fixed HTTPS endpoint, Basic auth, bounded time, and no redirect", async () => {
  let calls = 0;
  await sendBeemOtp(config, "+255712345678", "123456", async (url, init) => {
    calls++;
    assert.equal(url, "https://apisms.beem.africa/v1/send");
    assert.equal(init?.redirect, "error");
    assert.ok(init?.signal);
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      `Basic ${btoa("test-key:test-secret")}`,
    );
    const body = JSON.parse(init?.body as string);
    assert.deepEqual(body.recipients, [
      { recipient_id: "1", dest_addr: "255712345678" },
    ]);
    assert.equal(body.source_addr, "GariLink");
    assert.match(body.message, /123456/);
    return success();
  });
  assert.equal(calls, 1);
});

test("HTTP success with a rejected SMS is not reported as successful", async () => {
  for (const body of [{ successful: false, code: 102 }, { code: 100 }, null]) {
    await assert.rejects(
      sendBeemOtp(config, "+255712345678", "123456", async () =>
        Response.json(body),
      ),
      SmsDeliveryError,
    );
  }
});

test("provider errors and timeouts are sanitized and never automatically retried", async () => {
  let calls = 0;
  await assert.rejects(
    sendBeemOtp(config, "+255712345678", "123456", async () => {
      calls++;
      throw new Error("sensitive provider response 123456 test-secret");
    }),
    (error) =>
      error instanceof SmsDeliveryError &&
      !/123456|test-secret/.test(error.message),
  );
  assert.equal(calls, 1);
  await assert.rejects(
    sendBeemOtp(
      config,
      "+255712345678",
      "123456",
      async () => new Response("secret", { status: 401 }),
    ),
    SmsDeliveryError,
  );
});

test("missing configuration or invalid OTP never contacts Beem", async () => {
  const never: typeof fetch = async () => {
    assert.fail("Must not send");
  };
  await assert.rejects(
    sendBeemOtp({ ...config, apiKey: "" }, "+255712345678", "123456", never),
  );
  await assert.rejects(sendBeemOtp(config, "+255712345678", "code", never));
});

test("valid signed Auth hook submits exactly one message", async () => {
  let calls = 0;
  const hook = createSmsHook(
    (body, headers) => webhook.verify(body, headers),
    config,
    async () => {
      calls++;
      return success();
    },
    testLedger(),
  );
  const result = await hook(signedRequest());
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), {});
  assert.equal(calls, 1);
});

test("unsigned, tampered, expired and future signatures cannot send messages", async () => {
  const hook = createSmsHook(
    (body, headers) => webhook.verify(body, headers),
    config,
    async () => {
      assert.fail("Invalid signature must not send");
    },
    testLedger(),
  );
  const requests = [
    new Request("https://example.test", { method: "POST", body: event }),
    signedRequest(event.replace("123456", "999999"), new Date(), event),
    signedRequest(event, new Date(Date.now() - 600_000)),
    signedRequest(event, new Date(Date.now() + 600_000)),
  ];
  for (const request of requests)
    assert.equal((await hook(request)).status, 401);
});

test("hook enforces method and body limit even without Content-Length", async () => {
  const hook = createSmsHook(
    () => {
      assert.fail("Must reject before verification");
    },
    config,
    fetch,
    testLedger(),
  );
  assert.equal((await hook(new Request("https://example.test"))).status, 405);
  assert.equal(
    (
      await hook(
        new Request("https://example.test", {
          method: "POST",
          body: "x".repeat(16385),
        }),
      )
    ).status,
    413,
  );
});

test("hook reports failure without exposing provider body or code", async () => {
  const hook = createSmsHook(
    (body, headers) => webhook.verify(body, headers),
    config,
    async () => Response.json({ code: 102, message: "private account data" }),
    testLedger(),
  );
  const response = await hook(signedRequest());
  assert.equal(response.status, 503);
  assert.doesNotMatch(
    await response.text(),
    /private account|123456|test-secret/,
  );
});

test("accepted webhook retries return success without sending a second SMS", async () => {
  let calls = 0;
  const ledger = testLedger();
  const hook = createSmsHook(
    (body, headers) => webhook.verify(body, headers),
    config,
    async () => {
      calls++;
      return success();
    },
    ledger,
  );
  assert.equal((await hook(signedRequest())).status, 200);
  assert.equal((await hook(signedRequest())).status, 200);
  assert.equal(calls, 1);
});

test("concurrent hook retries and uncertain delivery never send twice", async () => {
  let calls = 0;
  const ledger = testLedger();
  const hook = createSmsHook(
    (body, headers) => webhook.verify(body, headers),
    config,
    async () => {
      calls++;
      throw new Error("Unknown send outcome");
    },
    ledger,
  );
  const results = await Promise.all([
    hook(signedRequest()),
    hook(signedRequest()),
  ]);
  assert.deepEqual(
    results.map((result) => result.status),
    [503, 503],
  );
  assert.equal(calls, 1);
  assert.equal((await hook(signedRequest())).status, 503);
  assert.equal(calls, 1);
});

test("ledger outage fails closed before spending SMS credits", async () => {
  const hook = createSmsHook(
    (body, headers) => webhook.verify(body, headers),
    config,
    async () => {
      assert.fail("No send without a durable claim");
    },
    {
      async claim() {
        throw new Error("Unavailable");
      },
      async accept() {},
    },
  );
  assert.equal((await hook(signedRequest())).status, 503);
});
