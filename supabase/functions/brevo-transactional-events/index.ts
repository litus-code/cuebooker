import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-cuebooker-webhook-secret",
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

async function rest<T>(url: string, init: RequestInit, serviceKey: string): Promise<T> {
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
  if (!response.ok) throw new Error(`supabase_${response.status}:${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : null) as T;
}

function eventTime(payload: any) {
  const seconds = Number(payload?.ts_event || payload?.ts || 0);
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : new Date().toISOString();
}

function eventTagId(payload: any) {
  const tags = Array.isArray(payload?.tags) ? payload.tags : [];
  const tag = tags.find((item: unknown) => typeof item === "string" && item.startsWith("cuebooker_email_"));
  return tag ? String(tag).replace(/^cuebooker_email_/, "") : "";
}

function mappedStatus(event: string) {
  const key = event.toLowerCase();
  if (key === "delivered") return "delivered";
  if (key === "deferred") return "deferred";
  if (key === "soft_bounce" || key === "softbounce") return "soft_bounce";
  if (key === "hard_bounce" || key === "hardbounce") return "hard_bounce";
  if (key === "blocked") return "blocked";
  if (key === "spam") return "spam";
  if (key === "invalid" || key === "invalid_email") return "invalid";
  if (key === "request" || key === "sent") return "accepted";
  return "";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const expectedSecret = Deno.env.get("BREVO_TRANSACTIONAL_WEBHOOK_SECRET")?.trim();
  if (!expectedSecret) return json({ error: "webhook_not_configured" }, 503);
  if (request.headers.get("x-cuebooker-webhook-secret") !== expectedSecret) {
    return json({ error: "unauthorized" }, 401);
  }

  let payload: any;
  try { payload = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }

  const event = String(payload?.event || "").trim();
  const messageId = String(payload?.["message-id"] || "").trim();
  const deliveryStatus = mappedStatus(event);
  if (!event) return json({ error: "missing_event" }, 400);

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    let emailId = eventTagId(payload);

    if (!emailId && messageId) {
      const rows = await rest<Array<{ id: string }>>(
        `${supabaseUrl}/rest/v1/email_messages?provider_message_id=eq.${encodeURIComponent(messageId)}&select=id&limit=1`,
        { method: "GET" },
        serviceKey
      );
      emailId = rows[0]?.id || "";
    }

    if (!emailId) return json({ accepted: true, matched: false });

    const at = eventTime(payload);
    const patch: Record<string, unknown> = { last_delivery_event_at: at };

    if (deliveryStatus) patch.delivery_status = deliveryStatus;
    if (deliveryStatus === "delivered") patch.delivered_at = at;
    if (["soft_bounce","hard_bounce","blocked","spam","invalid"].includes(deliveryStatus)) {
      patch.bounced_at = at;
      patch.delivery_failure_code = String(payload?.reason || event).slice(0, 300);
    }
    if (event === "opened" || event === "unique_opened") patch.opened_at = at;

    await rest(
      `${supabaseUrl}/rest/v1/email_messages?id=eq.${encodeURIComponent(emailId)}`,
      { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(patch) },
      serviceKey
    );

    return json({ accepted: true, matched: true });
  } catch (error) {
    console.error("brevo-transactional-events", error);
    return json({ error: "webhook_processing_failed" }, 500);
  }
});
