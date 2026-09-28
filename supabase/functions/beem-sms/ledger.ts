export interface SmsLedger {
  claim(id: string): Promise<"NEW" | "ACCEPTED" | "UNKNOWN">;
  accept(id: string): Promise<void>;
}

export function createSmsLedger(
  url: string,
  serviceKey: string,
  fetcher: typeof fetch = fetch,
): SmsLedger {
  const base = new URL(url);
  if (
    !serviceKey ||
    (base.protocol !== "https:" &&
      !["localhost", "127.0.0.1", "kong"].includes(base.hostname))
  ) {
    throw new Error("SMS ledger configuration is required");
  }
  async function rpc(name: string, id: string) {
    const response = await fetcher(new URL(`/rest/v1/rpc/${name}`, base), {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(500),
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message_id: id }),
    });
    if (!response.ok) throw new Error("SMS ledger unavailable");
    const body = await response.text();
    return body ? JSON.parse(body) : null;
  }
  return {
    async claim(id) {
      const result = await rpc("garilink_claim_sms", id);
      if (!["NEW", "ACCEPTED", "UNKNOWN"].includes(result))
        throw new Error("SMS ledger unavailable");
      return result;
    },
    async accept(id) {
      await rpc("garilink_accept_sms", id);
    },
  };
}
