import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { renderNotificationEmail, type NotificationEmailKind } from "../_shared/notificationEmailTemplates.ts";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
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

async function serviceJson<T>(
  url: string,
  init: RequestInit,
  serviceKey: string
): Promise<T> {
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
  if (!response.ok) throw new Error(`supabase_${response.status}:${text.slice(0, 400)}`);
  return (text ? JSON.parse(text) : null) as T;
}

function appOrigin(supabaseUrl: string) {
  const configured = Deno.env.get("CUEBOOKER_APP_ORIGIN")?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === "https:" || url.hostname === "localhost") return url.origin;
    } catch {
      // Fall through to environment-derived origin.
    }
  }
  return supabaseUrl.includes("lycprjeuuynfzwskycwv")
    ? "https://staging.cuebooker.com"
    : "https://cuebooker.com";
}

function retryDelayMs(attempt: number) {
  const delays = [
    5 * 60_000,
    30 * 60_000,
    2 * 60 * 60_000,
    12 * 60 * 60_000,
    24 * 60 * 60_000
  ];
  return delays[Math.min(Math.max(attempt - 1, 0), delays.length - 1)];
}

function safeErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.split(":")[0].slice(0, 120).replace(/[^a-zA-Z0-9_-]/g, "_") || "notification_email_failed";
}

type ClaimedDelivery = {
  delivery_id: string;
  notification_id: string;
  recipient_user_id: string;
  attempts: number;
};

type NotificationRow = {
  id: string;
  workspace_id: string;
  recipient_user_id: string;
  booking_id: string;
  activity_id: string | null;
  kind: NotificationEmailKind;
  metadata: Record<string, unknown>;
};

type BookingRow = {
  id: string;
  workspace_id: string;
  artist_id: string;
  primary_contact_id: string | null;
  counterparty_id: string | null;
  event_name: string | null;
  venue_name: string | null;
  city: string | null;
  event_date: string | null;
};

async function markDeliveryFailed(
  supabaseUrl: string,
  serviceKey: string,
  delivery: ClaimedDelivery,
  errorCode: string
) {
  const failedAt = new Date();
  const nextAttemptAt = new Date(failedAt.getTime() + retryDelayMs(delivery.attempts));
  await serviceJson(
    `${supabaseUrl}/rest/v1/notification_email_deliveries?id=eq.${encodeURIComponent(delivery.delivery_id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "failed",
        provider: "brevo",
        last_error_code: errorCode,
        next_attempt_at: nextAttemptAt.toISOString(),
        processing_started_at: null,
        failed_at: failedAt.toISOString()
      })
    },
    serviceKey
  );
}

async function processDelivery(
  supabaseUrl: string,
  serviceKey: string,
  brevoKey: string,
  delivery: ClaimedDelivery
) {
  const notifications = await serviceJson<NotificationRow[]>(
    `${supabaseUrl}/rest/v1/notifications?id=eq.${encodeURIComponent(delivery.notification_id)}&select=id,workspace_id,recipient_user_id,booking_id,activity_id,kind,metadata&limit=1`,
    { method: "GET" },
    serviceKey
  );
  const notification = notifications[0];
  if (!notification) throw new Error("notification_not_found");
  if (notification.recipient_user_id !== delivery.recipient_user_id) {
    throw new Error("notification_recipient_mismatch");
  }

  const bookings = await serviceJson<BookingRow[]>(
    `${supabaseUrl}/rest/v1/bookings?workspace_id=eq.${encodeURIComponent(notification.workspace_id)}&id=eq.${encodeURIComponent(notification.booking_id)}&select=id,workspace_id,artist_id,primary_contact_id,counterparty_id,event_name,venue_name,city,event_date&limit=1`,
    { method: "GET" },
    serviceKey
  );
  const booking = bookings[0];
  if (!booking) throw new Error("booking_not_found");

  const userResponse = await fetch(
    `${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(delivery.recipient_user_id)}`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`
      }
    }
  );
  if (!userResponse.ok) throw new Error(`recipient_lookup_${userResponse.status}`);
  const recipient = await userResponse.json();
  const recipientEmail = String(recipient?.email || "").trim();
  if (!recipientEmail) throw new Error("recipient_email_missing");

  const profiles = await serviceJson<Array<{ display_name: string | null }>>(
    `${supabaseUrl}/rest/v1/profiles?user_id=eq.${encodeURIComponent(delivery.recipient_user_id)}&select=display_name&limit=1`,
    { method: "GET" },
    serviceKey
  );

  const artists = await serviceJson<Array<{ stage_name: string }>>(
    `${supabaseUrl}/rest/v1/artists?id=eq.${encodeURIComponent(booking.artist_id)}&select=stage_name&limit=1`,
    { method: "GET" },
    serviceKey
  );
  const artistName = artists[0]?.stage_name?.trim();
  if (!artistName) throw new Error("artist_not_found");

  let contactName: string | null = null;
  if (booking.primary_contact_id) {
    const contacts = await serviceJson<Array<{ name: string }>>(
      `${supabaseUrl}/rest/v1/contacts?workspace_id=eq.${encodeURIComponent(notification.workspace_id)}&id=eq.${encodeURIComponent(booking.primary_contact_id)}&select=name&limit=1`,
      { method: "GET" },
      serviceKey
    );
    contactName = contacts[0]?.name?.trim() || null;
  }

  let organizationName: string | null = null;
  if (booking.counterparty_id) {
    const counterparties = await serviceJson<Array<{ name: string }>>(
      `${supabaseUrl}/rest/v1/counterparties?workspace_id=eq.${encodeURIComponent(notification.workspace_id)}&id=eq.${encodeURIComponent(booking.counterparty_id)}&select=name&limit=1`,
      { method: "GET" },
      serviceKey
    );
    organizationName = counterparties[0]?.name?.trim() || null;
  }

  const rawLocale =
    recipient?.user_metadata?.cuebooker_locale ??
    recipient?.user_metadata?.locale ??
    recipient?.app_metadata?.locale;
  const locale = rawLocale === "en" ? "en" : "es";

  const bookingUrl = `${appOrigin(supabaseUrl)}/workspace?artist=${encodeURIComponent(booking.artist_id)}&booking=${encodeURIComponent(booking.id)}`;
  const rendered = renderNotificationEmail({
    kind: notification.kind,
    locale,
    recipientName: profiles[0]?.display_name || null,
    artistName,
    bookingUrl,
    contactName,
    organizationName,
    eventName: booking.event_name,
    venueName: booking.venue_name,
    city: booking.city,
    eventDate: booking.event_date
  });

  const fromEmail = Deno.env.get("CUEBOOKER_FROM_EMAIL")?.trim() || "bookings@cuebooker.com";
  const fromName = Deno.env.get("CUEBOOKER_FROM_NAME")?.trim() || "Cuebooker";

  const providerResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: recipientEmail }],
      subject: rendered.subject,
      htmlContent: rendered.html,
      textContent: rendered.text,
      headers: {
        "X-Cuebooker-Notification-Id": notification.id,
        "X-Cuebooker-Delivery-Id": delivery.delivery_id
      }
    })
  });
  const providerText = await providerResponse.text();
  if (!providerResponse.ok) {
    throw new Error(`brevo_${providerResponse.status}`);
  }

  let providerMessageId: string | null = null;
  try {
    providerMessageId = JSON.parse(providerText)?.messageId || null;
  } catch {
    providerMessageId = null;
  }

  const sentAt = new Date().toISOString();
  await serviceJson(
    `${supabaseUrl}/rest/v1/notification_email_deliveries?id=eq.${encodeURIComponent(delivery.delivery_id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "sent",
        provider: "brevo",
        provider_message_id: providerMessageId,
        last_error_code: null,
        processing_started_at: null,
        sent_at: sentAt,
        failed_at: null
      })
    },
    serviceKey
  );

  console.log(JSON.stringify({
    scope: "dispatch-notification-emails",
    event: "delivery_sent",
    delivery_id: delivery.delivery_id,
    notification_id: notification.id,
    booking_id: booking.id,
    attempt: delivery.attempts
  }));
}

Deno.serve(async request => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization") || "";
  const suppliedToken = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!suppliedToken || suppliedToken !== serviceKey) {
    return json({ error: "authentication_required" }, 401);
  }

  const brevoKey = Deno.env.get("BREVO_API_KEY")?.trim();
  if (!brevoKey) return json({ error: "email_provider_not_configured" }, 503);

  let requestedLimit = 10;
  try {
    const payload = await request.json();
    if (payload?.limit !== undefined) {
      const parsed = Number(payload.limit);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 25) {
        return json({ error: "invalid_limit" }, 400);
      }
      requestedLimit = parsed;
    }
  } catch {
    // Empty body is valid.
  }

  let claimed: ClaimedDelivery[];
  try {
    claimed = await serviceJson<ClaimedDelivery[]>(
      `${supabaseUrl}/rest/v1/rpc/claim_notification_email_deliveries`,
      {
        method: "POST",
        body: JSON.stringify({ batch_size: requestedLimit })
      },
      serviceKey
    );
  } catch (error) {
    console.error("dispatch-notification-emails claim", error);
    return json({ error: "notification_claim_failed" }, 500);
  }

  let sent = 0;
  let failed = 0;

  for (const delivery of claimed) {
    try {
      await processDelivery(supabaseUrl, serviceKey, brevoKey, delivery);
      sent += 1;
    } catch (error) {
      failed += 1;
      const errorCode = safeErrorCode(error);
      console.error("dispatch-notification-emails delivery", delivery.delivery_id, error);
      try {
        await markDeliveryFailed(supabaseUrl, serviceKey, delivery, errorCode);
      } catch (markError) {
        console.error("dispatch-notification-emails mark-failed", delivery.delivery_id, markError);
      }
    }
  }

  return json({
    claimed: claimed.length,
    sent,
    failed
  });
});
