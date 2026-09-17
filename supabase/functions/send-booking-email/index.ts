import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`missing_${name.toLowerCase()}`);
  return value;
}

async function rest<T>(
  url: string,
  init: RequestInit,
  key: string,
  token: string
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });

  const text = await response.text();
  if (!response.ok) throw new Error(`supabase_${response.status}:${text.slice(0, 400)}`);
  return (text ? JSON.parse(text) : null) as T;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authorization = request.headers.get("Authorization") || "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) return json({ error: "authentication_required" }, 401);

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const workspaceId = String(payload?.workspaceId || "").trim();
  const bookingId = String(payload?.bookingId || "").trim();
  const requestedContactId = String(payload?.contactId || "").trim();
  const subject = String(payload?.subject || "").trim();
  const bodyText = String(payload?.bodyText || "").trim();

  if (!workspaceId || !bookingId || !subject || !bodyText) {
    return json({ error: "missing_required_fields" }, 400);
  }
  if (subject.length > 300 || bodyText.length > 20000) {
    return json({ error: "email_content_too_long" }, 400);
  }

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const anonKey = requiredEnv("SUPABASE_ANON_KEY");
    const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` }
    });
    if (!userResponse.ok) return json({ error: "authentication_required" }, 401);
    const user = await userResponse.json();
    const userId = String(user?.id || "");
    if (!userId) return json({ error: "authentication_required" }, 401);

    const memberships = await rest<Array<{ role: string }>>(
      `${supabaseUrl}/rest/v1/workspace_members?workspace_id=eq.${encodeURIComponent(workspaceId)}&user_id=eq.${encodeURIComponent(userId)}&select=role&limit=1`,
      { method: "GET" },
      anonKey,
      accessToken
    );
    const role = memberships[0]?.role;
    if (!role || !["owner", "admin", "manager", "editor"].includes(role)) {
      return json({ error: "workspace_edit_permission_required" }, 403);
    }

    const bookings = await rest<Array<{
      id: string;
      primary_contact_id: string | null;
      archived_at: string | null;
    }>>(
      `${supabaseUrl}/rest/v1/bookings?workspace_id=eq.${encodeURIComponent(workspaceId)}&id=eq.${encodeURIComponent(bookingId)}&select=id,primary_contact_id,archived_at&limit=1`,
      { method: "GET" },
      anonKey,
      accessToken
    );
    const booking = bookings[0];
    if (!booking) return json({ error: "booking_not_found" }, 404);
    if (booking.archived_at) return json({ error: "archived_booking_read_only" }, 409);

    const contactId = requestedContactId || booking.primary_contact_id || "";
    if (!contactId) return json({ error: "booking_contact_required" }, 400);

    let contactLinked = booking.primary_contact_id === contactId;
    if (!contactLinked) {
      const links = await rest<Array<{ contact_id: string }>>(
        `${supabaseUrl}/rest/v1/booking_contacts?workspace_id=eq.${encodeURIComponent(workspaceId)}&booking_id=eq.${encodeURIComponent(bookingId)}&contact_id=eq.${encodeURIComponent(contactId)}&select=contact_id&limit=1`,
        { method: "GET" },
        anonKey,
        accessToken
      );
      contactLinked = links.length > 0;
    }
    if (!contactLinked) return json({ error: "contact_not_linked_to_booking" }, 400);

    const contacts = await rest<Array<{ id: string; email: string | null }>>(
      `${supabaseUrl}/rest/v1/contacts?workspace_id=eq.${encodeURIComponent(workspaceId)}&id=eq.${encodeURIComponent(contactId)}&select=id,email&limit=1`,
      { method: "GET" },
      anonKey,
      accessToken
    );
    const toEmail = contacts[0]?.email?.trim();
    if (!toEmail) return json({ error: "contact_email_required" }, 400);

    const queuedRows = await rest<Array<{ id: string; reply_token: string }>>(
      `${supabaseUrl}/rest/v1/email_messages?select=id,reply_token`,
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          booking_id: bookingId,
          contact_id: contactId,
          direction: "outbound",
          to_email: toEmail,
          subject,
          body_text: bodyText,
          status: "queued",
          created_by: userId
        })
      },
      anonKey,
      accessToken
    );
    const queued = queuedRows[0];
    if (!queued) throw new Error("email_queue_create_failed");

    const brevoKey = Deno.env.get("BREVO_API_KEY")?.trim();
    if (!brevoKey) {
      await rest(
        `${supabaseUrl}/rest/v1/email_messages?id=eq.${encodeURIComponent(queued.id)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            status: "failed",
            failed_at: new Date().toISOString(),
            failure_code: "provider_not_configured"
          })
        },
        serviceKey,
        serviceKey
      );
      return json({ error: "email_provider_not_configured" }, 503);
    }

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
        to: [{ email: toEmail }],
        subject,
        textContent: bodyText
      })
    });
    const providerText = await providerResponse.text();

    if (!providerResponse.ok) {
      await rest(
        `${supabaseUrl}/rest/v1/email_messages?id=eq.${encodeURIComponent(queued.id)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            status: "failed",
            provider: "brevo",
            failed_at: new Date().toISOString(),
            failure_code: `brevo_${providerResponse.status}`
          })
        },
        serviceKey,
        serviceKey
      );
      return json({ error: "email_delivery_failed" }, 502);
    }

    let providerMessageId: string | null = null;
    try {
      providerMessageId = JSON.parse(providerText)?.messageId || null;
    } catch {
      providerMessageId = null;
    }
    const sentAt = new Date().toISOString();

    await rest(
      `${supabaseUrl}/rest/v1/email_messages?id=eq.${encodeURIComponent(queued.id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
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
      serviceKey,
      serviceKey
    );

    await rest(
      `${supabaseUrl}/rest/v1/activities`,
      {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          booking_id: bookingId,
          type: "email",
          direction: "outbound",
          contact_id: contactId,
          actor_user_id: userId,
          body: bodyText,
          metadata: {
            email_message_id: queued.id,
            subject,
            to_email: toEmail,
            provider: "brevo",
            provider_message_id: providerMessageId
          },
          visibility: "workspace",
          occurred_at: sentAt,
          created_by: userId
        })
      },
      serviceKey,
      serviceKey
    );

    return json({
      id: queued.id,
      status: "sent",
      to: toEmail,
      providerMessageId
    });
  } catch (error) {
    console.error("send-booking-email", error);
    return json({ error: "email_send_failed" }, 500);
  }
});
