import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { consumePublicRateLimit, publicRateLimitKey } from "../_shared/publicRateLimit.ts";

function allowedOrigin(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const local = url.protocol === "http:" && (host === "localhost" || host === "127.0.0.1");
    const cuebooker = url.protocol === "https:" && (
      host === "cuebooker.com" ||
      host === "www.cuebooker.com" ||
      host === "staging.cuebooker.com" ||
      host === "cuebooker-staging.pages.dev" ||
      host.endsWith(".cuebooker-staging.pages.dev")
    );
    return local || cuebooker ? url.origin : null;
  } catch {
    return null;
  }
}

function corsHeaders(request: Request) {
  const origin = allowedOrigin(request.headers.get("Origin"));
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin"
  };
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`missing_${name.toLowerCase()}`);
  return value;
}

function validToken(value: string) {
  return /^[A-Za-z0-9_-]{32,128}$/.test(value);
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function serviceJson<T>(url: string, init: RequestInit, serviceKey: string): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`supabase_${response.status}:${text.slice(0, 500)}`);
  return (text ? JSON.parse(text) : null) as T;
}


function dispatchNotificationEmails(supabaseUrl: string, serviceKey: string, limit = 10) {
  const task = fetch(`${supabaseUrl.replace(/\/$/, "")}/functions/v1/dispatch-notification-emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ limit })
  }).then(async response => {
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`notification_dispatch_${response.status}:${text.slice(0, 200)}`);
    }
  }).catch(error => {
    console.error("notification-dispatch", error);
  });

  EdgeRuntime.waitUntil(task);
}

function mapError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("follow_up_link_invalid") || message.includes("invalid_follow_up_token")) {
    return { status: 404, code: "follow_up_unavailable" };
  }
  if (message.includes("idempotency_key_reused")) return { status: 409, code: "request_id_reused" };
  if (message.includes("invalid_follow_up_message") || message.includes("invalid_request_fingerprint")) {
    return { status: 400, code: "invalid_request" };
  }
  return { status: 500, code: "follow_up_failed" };
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "GET" && request.method !== "POST") return json(request, { error: "method_not_allowed" }, 405);

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
    const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    if (request.method === "GET") {
      const token = new URL(request.url).searchParams.get("token")?.trim() || "";
      if (!validToken(token)) return json(request, { error: "follow_up_unavailable" }, 404);
      const tokenHash = await sha256Hex(token);
      const followUp = await serviceJson<Record<string, unknown>>(
        `${supabaseUrl}/rest/v1/rpc/get_public_booking_follow_up`,
        { method: "POST", body: JSON.stringify({ target_token_hash: tokenHash }) },
        serviceKey
      );
      return json(request, { followUp });
    }

    const length = Number(request.headers.get("content-length") || "0");
    if (Number.isFinite(length) && length > 16_384) return json(request, { error: "payload_too_large" }, 413);

    let payload: Record<string, unknown>;
    try {
      const parsed = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
      payload = parsed as Record<string, unknown>;
    } catch {
      return json(request, { error: "invalid_json" }, 400);
    }

    const token = typeof payload.token === "string" ? payload.token.trim() : "";
    const requestId = typeof payload.requestId === "string" ? payload.requestId.trim().toLowerCase() : "";
    const bodyText = typeof payload.bodyText === "string" ? payload.bodyText.trim() : "";
    if (!validToken(token) || !validUuid(requestId) || !bodyText || bodyText.length > 10000) {
      return json(request, { error: "invalid_request" }, 400);
    }

    const clientKey = await publicRateLimitKey(request, serviceKey, "booking-follow-up-client");
    const clientDecision = await consumePublicRateLimit(
      serviceJson, supabaseUrl, serviceKey, "booking_follow_up_client", clientKey, 30, 600
    );
    if (!clientDecision.allowed) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: {
          ...corsHeaders(request),
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Retry-After": String(Math.max(clientDecision.retryAfterSeconds, 1))
        }
      });
    }

    const tokenRateKey = await publicRateLimitKey(request, serviceKey, "booking-follow-up-token", token);
    const tokenDecision = await consumePublicRateLimit(
      serviceJson, supabaseUrl, serviceKey, "booking_follow_up_token", tokenRateKey, 12, 600
    );
    if (!tokenDecision.allowed) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: {
          ...corsHeaders(request),
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Retry-After": String(Math.max(tokenDecision.retryAfterSeconds, 1))
        }
      });
    }

    const tokenHash = await sha256Hex(token);
    const fingerprint = await sha256Hex(bodyText);
    const rows = await serviceJson<Array<{ activity_id: string; created: boolean }>>(
      `${supabaseUrl}/rest/v1/rpc/append_public_booking_follow_up_reply`,
      {
        method: "POST",
        body: JSON.stringify({
          target_token_hash: tokenHash,
          target_idempotency_key: requestId,
          target_request_fingerprint: fingerprint,
          target_body_text: bodyText
        })
      },
      serviceKey
    );
    const result = rows?.[0];
    if (!result?.activity_id) throw new Error("follow_up_reply_missing_result");

    const followUp = await serviceJson<Record<string, unknown>>(
      `${supabaseUrl}/rest/v1/rpc/get_public_booking_follow_up`,
      { method: "POST", body: JSON.stringify({ target_token_hash: tokenHash }) },
      serviceKey
    );

    if (result.created) {
      dispatchNotificationEmails(supabaseUrl, serviceKey);
    }

    return json(request, { accepted: true, created: Boolean(result.created), followUp }, result.created ? 201 : 200);
  } catch (error) {
    const mapped = mapError(error);
    if (mapped.status >= 500) console.error("booking-follow-up", error);
    return json(request, { error: mapped.code }, mapped.status);
  }
});