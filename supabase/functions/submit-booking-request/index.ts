import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { consumePublicRateLimit, publicRateLimitKey } from "../_shared/publicRateLimit.ts";

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

  const locale = payload.locale === "en" ? "en" : "es";

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
    entrySource,
    locale
  };
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function secureToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
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

function allowedAppOrigin(value: string | null) {
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

function followUpOrigin(request: Request, supabaseUrl: string) {
  const requestOrigin = allowedAppOrigin(request.headers.get("Origin"));
  if (requestOrigin) return requestOrigin;
  return supabaseUrl.includes("lycprjeuuynfzwskycwv") ? "https://staging.cuebooker.com" : "https://cuebooker.com";
}

function replyDomain() {
  const value = Deno.env.get("CUEBOOKER_REPLY_DOMAIN")?.trim().toLowerCase() || "";
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value) || value.includes("..")) return null;
  return value;
}

function acknowledgementCopy(locale: "es" | "en", contactName: string, artistName: string, eventLabel: string | null) {
  if (locale === "en") {
    const subject = `Enquiry received · ${artistName}`;
    const lines = [
      `Hi ${contactName},`,
      "",
      `Your booking enquiry for ${artistName} is now registered in Cuebooker.`,
      ...(eventLabel ? ["", eventLabel] : []),
      "",
      "You can check the status and continue the conversation through your secure Cuebooker link. No account is required.",
      "",
      "You can also reply directly to this email.",
      "",
      "— Cuebooker"
    ];
    return { subject, storedBody: lines.join("\n"), linkLabel: "Secure follow-up link:" };
  }

  const subject = `Solicitud recibida · ${artistName}`;
  const lines = [
    `Hola ${contactName},`,
    "",
    `Tu solicitud de booking para ${artistName} ya está registrada en Cuebooker.`,
    ...(eventLabel ? ["", eventLabel] : []),
    "",
    "Puedes consultar el estado y continuar la conversación desde tu enlace seguro de Cuebooker. No necesitas una cuenta.",
    "",
    "También puedes responder directamente a este email.",
    "",
    "— Cuebooker"
  ];
  return { subject, storedBody: lines.join("\n"), linkLabel: "Enlace seguro de seguimiento:" };
}

type BookingContext = {
  workspaceId: string;
  bookingId: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  artistName: string;
  eventName: string | null;
  venueName: string | null;
  eventCity: string | null;
  eventDate: string | null;
};

type AckEmail = {
  id: string;
  reply_token: string;
  status: string;
  subject: string;
  body_text: string;
  to_email: string;
  provider_message_id: string | null;
  from_email: string | null;
  sent_at: string | null;
};

async function bookingContext(supabaseUrl: string, serviceKey: string, bookingId: string): Promise<BookingContext> {
  const bookingRows = await serviceJson<Array<{
    id: string;
    workspace_id: string;
    artist_id: string;
    primary_contact_id: string;
    event_name: string | null;
    venue_name: string | null;
    city: string | null;
    event_date: string | null;
  }>>(
    `${supabaseUrl}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}&select=id,workspace_id,artist_id,primary_contact_id,event_name,venue_name,city,event_date&limit=1`,
    { method: "GET" },
    serviceKey
  );
  const booking = bookingRows[0];
  if (!booking?.workspace_id || !booking.primary_contact_id || !booking.artist_id) throw new Error("public_booking_context_missing");

  const contacts = await serviceJson<Array<{ id: string; name: string; email: string | null }>>(
    `${supabaseUrl}/rest/v1/contacts?workspace_id=eq.${encodeURIComponent(booking.workspace_id)}&id=eq.${encodeURIComponent(booking.primary_contact_id)}&select=id,name,email&limit=1`,
    { method: "GET" },
    serviceKey
  );
  const contact = contacts[0];
  if (!contact?.email) throw new Error("public_booking_contact_email_missing");

  const artists = await serviceJson<Array<{ stage_name: string }>>(
    `${supabaseUrl}/rest/v1/artists?id=eq.${encodeURIComponent(booking.artist_id)}&select=stage_name&limit=1`,
    { method: "GET" },
    serviceKey
  );
  const artist = artists[0];
  if (!artist?.stage_name) throw new Error("public_booking_artist_missing");

  return {
    workspaceId: booking.workspace_id,
    bookingId: booking.id,
    contactId: contact.id,
    contactName: contact.name,
    contactEmail: contact.email.trim(),
    artistName: artist.stage_name,
    eventName: booking.event_name,
    venueName: booking.venue_name,
    eventCity: booking.city,
    eventDate: booking.event_date
  };
}

function eventLabel(locale: "es" | "en", context: BookingContext) {
  const bits = [context.eventName, context.venueName, context.eventCity, context.eventDate].filter(Boolean);
  if (!bits.length) return null;
  return `${locale === "en" ? "Enquiry" : "Solicitud"}: ${bits.join(" · ")}`;
}

async function ensureAcknowledgementActivity(
  supabaseUrl: string,
  serviceKey: string,
  context: BookingContext,
  email: AckEmail
) {
  const url = new URL(`${supabaseUrl}/rest/v1/activities`);
  url.searchParams.set("workspace_id", `eq.${context.workspaceId}`);
  url.searchParams.set("booking_id", `eq.${context.bookingId}`);
  url.searchParams.set("metadata->>email_message_id", `eq.${email.id}`);
  url.searchParams.set("select", "id");
  url.searchParams.set("limit", "1");
  const existing = await serviceJson<Array<{ id: string }>>(url.toString(), { method: "GET" }, serviceKey);
  if (existing.length) return;

  await serviceJson(
    `${supabaseUrl}/rest/v1/activities`,
    {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        workspace_id: context.workspaceId,
        booking_id: context.bookingId,
        type: "email",
        direction: "outbound",
        contact_id: context.contactId,
        actor_user_id: null,
        body: email.body_text,
        metadata: {
          email_message_id: email.id,
          subject: email.subject,
          to_email: email.to_email,
          provider: "brevo",
          provider_message_id: email.provider_message_id,
          purpose: "public_acknowledgement"
        },
        visibility: "workspace",
        occurred_at: email.sent_at || new Date().toISOString(),
        created_by: null
      })
    },
    serviceKey
  );
}

async function failAcknowledgement(
  supabaseUrl: string,
  serviceKey: string,
  emailId: string,
  accessId: string,
  failureCode: string
) {
  const failedAt = new Date().toISOString();
  await serviceJson(
    `${supabaseUrl}/rest/v1/email_messages?id=eq.${encodeURIComponent(emailId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: "failed", failed_at: failedAt, failure_code: failureCode })
    },
    serviceKey
  );
  await serviceJson(
    `${supabaseUrl}/rest/v1/public_booking_follow_up_access?id=eq.${encodeURIComponent(accessId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ revoked_at: failedAt })
    },
    serviceKey
  );
}

async function sendAcknowledgement(
  request: Request,
  supabaseUrl: string,
  serviceKey: string,
  bookingId: string,
  locale: "es" | "en"
) {
  const context = await bookingContext(supabaseUrl, serviceKey, bookingId);
  const existingEmails = await serviceJson<AckEmail[]>(
    `${supabaseUrl}/rest/v1/email_messages?workspace_id=eq.${encodeURIComponent(context.workspaceId)}&booking_id=eq.${encodeURIComponent(context.bookingId)}&purpose=eq.public_acknowledgement&select=id,reply_token,status,subject,body_text,to_email,provider_message_id,from_email,sent_at&limit=1`,
    { method: "GET" },
    serviceKey
  );
  const existing = existingEmails[0];
  if (existing?.status === "sent") {
    await ensureAcknowledgementActivity(supabaseUrl, serviceKey, context, existing);
    return true;
  }

  const token = secureToken();
  const tokenHash = await sha256Hex(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();

  await serviceJson(
    `${supabaseUrl}/rest/v1/public_booking_follow_up_access?workspace_id=eq.${encodeURIComponent(context.workspaceId)}&booking_id=eq.${encodeURIComponent(context.bookingId)}&contact_id=eq.${encodeURIComponent(context.contactId)}&revoked_at=is.null`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ revoked_at: now.toISOString() })
    },
    serviceKey
  );

  const accessRows = await serviceJson<Array<{ id: string }>>(
    `${supabaseUrl}/rest/v1/public_booking_follow_up_access?select=id`,
    {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        workspace_id: context.workspaceId,
        booking_id: context.bookingId,
        contact_id: context.contactId,
        token_hash: tokenHash,
        expires_at: expiresAt
      })
    },
    serviceKey
  );
  const access = accessRows[0];
  if (!access?.id) throw new Error("follow_up_access_create_failed");

  const copy = acknowledgementCopy(locale, context.contactName, context.artistName, eventLabel(locale, context));
  let email: AckEmail;

  if (existing) {
    const updated = await serviceJson<AckEmail[]>(
      `${supabaseUrl}/rest/v1/email_messages?id=eq.${encodeURIComponent(existing.id)}&select=id,reply_token,status,subject,body_text,to_email,provider_message_id,from_email,sent_at`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          to_email: context.contactEmail,
          contact_id: context.contactId,
          subject: copy.subject,
          body_text: copy.storedBody,
          status: "queued",
          provider: null,
          provider_message_id: null,
          from_email: null,
          sent_at: null,
          failed_at: null,
          failure_code: null,
          created_by: null
        })
      },
      serviceKey
    );
    email = updated[0];
  } else {
    const inserted = await serviceJson<AckEmail[]>(
      `${supabaseUrl}/rest/v1/email_messages?select=id,reply_token,status,subject,body_text,to_email,provider_message_id,from_email,sent_at`,
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          workspace_id: context.workspaceId,
          booking_id: context.bookingId,
          contact_id: context.contactId,
          direction: "outbound",
          to_email: context.contactEmail,
          subject: copy.subject,
          body_text: copy.storedBody,
          status: "queued",
          purpose: "public_acknowledgement",
          created_by: null
        })
      },
      serviceKey
    );
    email = inserted[0];
  }

  if (!email?.id || !email.reply_token) throw new Error("acknowledgement_email_queue_failed");

  const brevoKey = Deno.env.get("BREVO_API_KEY")?.trim();
  const configuredReplyDomain = replyDomain();
  if (!brevoKey || !configuredReplyDomain) {
    await failAcknowledgement(supabaseUrl, serviceKey, email.id, access.id, !brevoKey ? "provider_not_configured" : "reply_domain_not_configured");
    return false;
  }

  const fromEmail = Deno.env.get("CUEBOOKER_FROM_EMAIL")?.trim() || "bookings@cuebooker.com";
  const fromName = Deno.env.get("CUEBOOKER_FROM_NAME")?.trim() || "Cuebooker";
  const replyToEmail = `booking+${email.reply_token}@${configuredReplyDomain}`;
  const followUpUrl = `${followUpOrigin(request, supabaseUrl)}/request?token=${encodeURIComponent(token)}`;
  const providerBody = `${copy.storedBody}\n\n${copy.linkLabel}\n${followUpUrl}`;

  const providerResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": brevoKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: context.contactEmail }],
      replyTo: { email: replyToEmail, name: fromName },
      subject: copy.subject,
      textContent: providerBody
    })
  });
  const providerText = await providerResponse.text();

  if (!providerResponse.ok) {
    await failAcknowledgement(supabaseUrl, serviceKey, email.id, access.id, `brevo_${providerResponse.status}`);
    return false;
  }

  let providerMessageId: string | null = null;
  try { providerMessageId = JSON.parse(providerText)?.messageId || null; } catch { providerMessageId = null; }
  const sentAt = new Date().toISOString();
  const sentRows = await serviceJson<AckEmail[]>(
    `${supabaseUrl}/rest/v1/email_messages?id=eq.${encodeURIComponent(email.id)}&select=id,reply_token,status,subject,body_text,to_email,provider_message_id,from_email,sent_at`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status: "sent",
        provider: "brevo",
        provider_message_id: providerMessageId,
        from_email: fromEmail,
        sent_at: sentAt,
        failed_at: null,
        failure_code: null
      })
    },
    serviceKey
  );
  const sent = sentRows[0];
  if (!sent) throw new Error("acknowledgement_email_finalize_failed");
  await ensureAcknowledgementActivity(supabaseUrl, serviceKey, context, sent);
  return true;
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
    return json({ accepted: true, created: false, confirmationSent: false }, 202);
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

    const [clientKey, artistKey, contactKey] = await Promise.all([
      publicRateLimitKey(request, serviceKey, "public-booking-client"),
      publicRateLimitKey(request, serviceKey, "public-booking-artist", payload.artistSlug),
      publicRateLimitKey(request, serviceKey, "public-booking-contact", `${payload.artistSlug}\n${payload.contactEmail}`)
    ]);
    const rateDecisions = await Promise.all([
      consumePublicRateLimit(serviceJson, supabaseUrl, serviceKey, "public_booking_client", clientKey, 20, 600),
      consumePublicRateLimit(serviceJson, supabaseUrl, serviceKey, "public_booking_artist", artistKey, 120, 3600),
      consumePublicRateLimit(serviceJson, supabaseUrl, serviceKey, "public_booking_contact", contactKey, 5, 3600)
    ]);
    const blocked = rateDecisions.filter(item => !item.allowed);
    if (blocked.length) {
      const retryAfter = Math.max(...blocked.map(item => item.retryAfterSeconds), 1);
      return json({ error: "rate_limited" }, 429, { "Retry-After": String(retryAfter) });
    }

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

    let confirmationSent = false;
    try {
      confirmationSent = await sendAcknowledgement(request, supabaseUrl, serviceKey, result.booking_id, payload.locale);
    } catch (error) {
      console.error("submit-booking-request acknowledgement", error);
    }

    if (result.created) {
      dispatchNotificationEmails(supabaseUrl, serviceKey);
    }

    return json({
      accepted: true,
      created: Boolean(result.created),
      confirmationSent,
      reference: result.booking_id
    }, result.created ? 201 : 200);
  } catch (error) {
    const mapped = mapDatabaseError(error);
    if (mapped.status >= 500) console.error("submit-booking-request", error);
    return json({ error: mapped.code }, mapped.status);
  }
});