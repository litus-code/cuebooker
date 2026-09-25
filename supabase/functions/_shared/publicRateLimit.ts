export type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

type ServiceJson = <T>(url: string, init: RequestInit, serviceKey: string) => Promise<T>;

function forwardedClientAddress(request: Request) {
  const forwarded = (request.headers.get("x-forwarded-for") || "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  const gatewayAddress = forwarded.length ? forwarded[forwarded.length - 1] : "";
  return gatewayAddress
    || request.headers.get("cf-connecting-ip")?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "";
}

async function hmacSha256Hex(secret: string, value: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function publicRateLimitKey(
  request: Request,
  serviceKey: string,
  namespace: string,
  value?: string
) {
  const source = value?.trim() || forwardedClientAddress(request);
  if (!source) return "";
  const pepper = Deno.env.get("CUEBOOKER_RATE_LIMIT_SECRET")?.trim() || serviceKey;
  return hmacSha256Hex(pepper, `${namespace}\n${source}`);
}

export async function consumePublicRateLimit(
  serviceJson: ServiceJson,
  supabaseUrl: string,
  serviceKey: string,
  scope: string,
  keyHash: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitDecision> {
  if (!keyHash) return { allowed: true, retryAfterSeconds: 0, remaining: maxRequests };

  const rows = await serviceJson<Array<{
    allowed: boolean;
    retry_after_seconds: number;
    remaining: number;
  }>>(
    `${supabaseUrl}/rest/v1/rpc/consume_public_rate_limit`,
    {
      method: "POST",
      body: JSON.stringify({
        target_scope: scope,
        target_key_hash: keyHash,
        target_max_requests: maxRequests,
        target_window_seconds: windowSeconds
      })
    },
    serviceKey
  );

  const row = rows?.[0];
  if (!row) throw new Error("rate_limit_missing_result");
  return {
    allowed: Boolean(row.allowed),
    retryAfterSeconds: Math.max(Number(row.retry_after_seconds) || 0, 0),
    remaining: Math.max(Number(row.remaining) || 0, 0)
  };
}
