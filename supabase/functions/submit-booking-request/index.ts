import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(body: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`missing_${name.toLowerCase()}`);
  return value;
}

function cleanOptional(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned) return null;
  if (cleaned.length > maxLength) throw new Error("invalid_payload");
  return cleaned;
}

function cleanRequired(value: unknown, maxLength: number) {
  const cleaned = cleanOptional(value, maxLength);
  if (!cleaned) throw new Error("invalid_payload");
  return cleaned;
}

function normalizePayload(payload: Record<string, unknown>) {
  const artistSlug = cleanRequired(payload.artistSlug, 120).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(artistSlug)) throw new Error("invalid_payload");

  const requestId = cleanRequired(payload.requestId, 36).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(requestId)) {
    throw new Error("invalid_payload");
  }

  const contactName = cleanRequired(payload.contactName, 160);
  const contactEmail = cleanRequired(payload.contactEmail, 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) throw new Error("invalid_payload");

  const contactPhone = cleanOptional(payload.contactPhone, 50);
  const organizationName = cleanOptional(payload.organizationName, 180);
  const eventName = cleanOptional(payload.eventName, 180);
  const venueName = cleanOptional(payload.venueName, 180);
  const eventCity = cleanOptional(payload.eventCity, 120);

  const eventCountryCode = cleanOptional(payload.eventCountryCode, 2)?.toUpperCase() || null;
  if (eventCountryCode && !/^[A-Z]{2}$/.test(eventCountryCode)) throw new Error("invalid_payload");

  const eventDate = cleanOptional(payload.eventDate, 10);
  if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) throw new Error("invalid_payload");

  const initialMessage = cleanOptional(payload.initialMessage, 10000);

  let offerAmountMinor: number | null = null;
  if (payload.offerAmountMinor !== null && payload.offerAmountMinor !== undefined && payload.offerAmountMinor !== "") {
    if (typeof payload.offerAmountMinor !== "number" || !Number.isSafeInteger(payload.offerAmountMinor) || payload.offerAmountMinor < 0) {
      throw new Error("invalid_payload");
    }
    offerAmountMinor = payload.offerAmountMinor;
  }

  const offerCurrency = cleanOptional(payload.offerCurrency, 3)?.toUpperCase() || null;
  if (offerCurrency && !/^[A-Z]{3}$/.test(offerCurrency)) throw new Error("invalid_payload");

  const entrySource = cleanOptional(payload.entrySource, 64)?.toLowerCase() || null;
  if (entrySource && !/^[a-z0-9][a-z0-9_-]*$/.test(entrySource)) throw new Error("invalid_payload");

  if (!eventName && !venueName && !eventDate && !initialMessage) throw new Error("booking_context_required");

  return {
    artistSlug,
    requestId,
    contactName,
    contactEmail,
    contactPhone,
    organizationName,
    eventName,
    venueName,
    eventCity,
    eventCountryCode,
    eventDate,
    offerAmountMinor,
    offerCurrency,
    initialMessage,
    entrySource
  };
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

function mapDatabaseError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("public_booking_unavailable")) return { status: 404, code: "booking_unavailable" };
  if (message.includes("idempotency_key_reused")) return { status: 409, code: "request_id_reused" };
  if (message.includes("booking_context_required")) return { status: 400, code: "booking_context_required" };
  if (message.includes("invalid_")) return { status: 400, code: "invalid_request" };
  return { status: 500, code: "booking_request_failed" };
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const length = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(length) && length > 32_768) return json({ error: "payload_too_large" }, 413);

  let rawPayload: unknown;
  try {
    rawPayload = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
    return json({ error: "invalid_request" }, 400);
  }

  const honeypot = (rawPayload as Record<string, unknown>).website;
  if (typeof honeypot === "string" && honeypot.trim()) {
    return json({ accepted: true, created: false }, 202);
  }

  try {
    const payload = normalizePayload(rawPayload as Record<string, unknown>);
    const fingerprintPayload = {
      artistSlug: payload.artistSlug,
      contactName: payload.contactName,
      contactEmail: payload.contactEmail,
      contactPhone: payload.contactPhone,
      organizationName: payload.organizationName,
      eventName: payload.eventName,
      venueName: payload.venueName,
      eventCity: payload.eventCity,
      eventCountryCode: payload.eventCountryCode,
      eventDate: payload.eventDate,
      offerAmountMinor: payload.offerAmountMinor,
      offerCurrency: payload.offerCurrency,
      initialMessage: payload.initialMessage,
      entrySource: payload.entrySource
    };
    const fingerprint = await sha256Hex(JSON.stringify(fingerprintPayload));

    const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
    const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    const rows = await serviceJson<Array<{ booking_id: string; created: boolean }>>(
      `${supabaseUrl}/rest/v1/rpc/create_public_booking`,
      {
        method: "POST",
        body: JSON.stringify({
          target_artist_slug: payload.artistSlug,
          target_idempotency_key: payload.requestId,
          target_request_fingerprint: fingerprint,
          contact_name: payload.contactName,
          contact_email: payload.contactEmail,
          contact_phone: payload.contactPhone,
          organization_name: payload.organizationName,
          event_name: payload.eventName,
          venue_name: payload.venueName,
          event_city: payload.eventCity,
          event_country_code: payload.eventCountryCode,
          event_date: payload.eventDate,
          offer_amount_minor: payload.offerAmountMinor,
          offer_currency: payload.offerCurrency,
          initial_message: payload.initialMessage,
          entry_source: payload.entrySource
        })
      },
      serviceKey
    );

    const result = rows?.[0];
    if (!result?.booking_id) throw new Error("public_booking_missing_result");

    return json({
      accepted: true,
      created: Boolean(result.created),
      reference: result.booking_id
    }, result.created ? 201 : 200);
  } catch (error) {
    const mapped = mapDatabaseError(error);
    if (mapped.status >= 500) console.error("submit-booking-request", error);
    return json({ error: mapped.code }, mapped.status);
  }
});
