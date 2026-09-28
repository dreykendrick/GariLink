export interface BeemConfig {
  apiKey: string;
  secretKey: string;
  senderId: string;
}

export class SmsDeliveryError extends Error {
  constructor() {
    super(
      "We could not send your verification code. Please try again shortly.",
    );
  }
}

/** Beem accepts digits with country code, without the leading E.164 plus. */
export function beemPhone(phone: unknown): string {
  if (typeof phone !== "string" || !/^\+?[1-9]\d{7,14}$/.test(phone)) {
    throw new Error("Invalid phone number");
  }
  return phone.replace(/^\+/, "");
}

export async function sendBeemOtp(
  config: BeemConfig,
  phone: unknown,
  otp: unknown,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const destination = beemPhone(phone);
  if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
    throw new Error("Invalid verification code");
  }
  if (
    !config.apiKey ||
    !config.secretKey ||
    !config.senderId ||
    !/^[\x20-\x7E]+$/.test(config.apiKey + config.secretKey) ||
    config.apiKey.includes(":") ||
    !/^[A-Za-z0-9 ]{1,11}$/.test(config.senderId)
  ) {
    throw new SmsDeliveryError();
  }
  try {
    // Keep below Supabase Auth's five-second HTTP hook deadline. No automatic
    // retry: a timed-out send might already have consumed SMS credit.
    const response = await fetcher("https://apisms.beem.africa/v1/send", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(3500),
      headers: {
        Authorization: `Basic ${btoa(`${config.apiKey}:${config.secretKey}`)}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        source_addr: config.senderId,
        encoding: 0,
        message: `Your GariLink verification code is ${otp}. Do not share this code.`,
        recipients: [{ recipient_id: "1", dest_addr: destination }],
      }),
    });
    if (!response.ok) throw new SmsDeliveryError();
    const result = await response.json();
    if (
      result?.successful !== true ||
      Number(result?.code) !== 100 ||
      (result?.invalid != null && Number(result.invalid) !== 0) ||
      (result?.valid != null && Number(result.valid) !== 1)
    ) {
      throw new SmsDeliveryError();
    }
  } catch {
    // Do not log OTPs, credentials, phone numbers, or provider response bodies.
    throw new SmsDeliveryError();
  }
}
