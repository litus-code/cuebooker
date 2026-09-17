import "jsr:@supabase/functions-js/edge-runtime.d.ts";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`missing_${name.toLowerCase()}`);
  return value;
}

function mailboxAddress(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (value && typeof value === "object") {
    const address = (value as Record<string, unknown>).Address ?? (value as Record<string, unknown>).address;
    return typeof address === "string" ? address.trim() || null : null;
  }
  return null;
}

function recipientAddresses(item: Record<string, unknown>) {
  const values: string[] = [];
  for (const key of ["Recipients", "To"]) {
    const raw = item[key];
    const entries = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (const entry of entries) {
      const address = mailboxAddress(entry);
      if (address) values.push(address);
    }
  }
  return Array.from(new Set(values));
}

function extractReplyToken(item: Record<string, unknown>) {
  for (const address of recipientAddresses(item)) {
    const match = address.match(/booking\+([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})@/i);
    if (match?.[1]) return { token: match[1].toLowerCase(), recipient: address };
  }
  return null;
}

async function serviceFetch(url: string, init: RequestInit, serviceKey: string) {
  return fetch(url, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
}

async function serviceJson<T>(url: string, init: RequestInit, serviceKey: string): Promise<T> {
  const response = await serviceFetch(url, init, serviceKey);
  const text = await response.text();
  if (!response.ok) throw new Error(`supabase_${response.status}:${text.slice(0, 400)}`);
  return (text ? JSON.parse(text) : null) as T;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const configuredSecret = Deno.env.get("CUEBOOKER_INBOUND_WEBHOOK_SECRET")?.trim();
  if (!configuredSecret) return json({ error: "webhook_not_configured" }, 503);
  const suppliedSecret = request.headers.get("x-cuebooker-webhook-secret")?.trim();
  if (!suppliedSecret || suppliedSecret !== configuredSecret) return json({ error: "unauthorized_webhook" }, 401);

  let payload: any;
  try { payload = await request.json(); }
  catch { return json({ error: "invalid_json" }, 400); }

  const items = Array.isArray(payload?.items) ? payload.items : [];
  if (!items.length) return json({ accepted: 0, ignored: 0 });

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    let accepted = 0;
    let ignored = 0;

    for (const rawItem of items) {
      const item = rawItem && typeof rawItem === "object" ? rawItem as Record<string, unknown> : {};
      const route = extractReplyToken(item);
      if (!route) { ignored += 1; continue; }

      const messageId = typeof item.MessageId === "string" ? item.MessageId.trim() : "";
      if (!messageId) { ignored += 1; continue; }

      const threadRows = await serviceJson<Array<{
        id: string;
        workspace_id: string;
        booking_id: string;
        contact_id: string;
        to_email: string;
        created_by: string;
      }>>(
        `${supabaseUrl}/rest/v1/email_messages?reply_token=eq.${encodeURIComponent(route.token)}&direction=eq.outbound&select=id,workspace_id,booking_id,contact_id,to_email,created_by&order=created_at.desc&limit=1`,
        { method: "GET" },
        serviceKey
      );
      const thread = threadRows[0];
      if (!thread) { ignored += 1; continue; }

      const fromEmail = mailboxAddress(item.From)?.toLowerCase() || "";
      if (!fromEmail || fromEmail !== thread.to_email.trim().toLowerCase()) {
        ignored += 1;
        continue;
      }

      const existing = await serviceJson<Array<{ id: string }>>(
        `${supabaseUrl}/rest/v1/email_messages?provider=eq.brevo&provider_message_id=eq.${encodeURIComponent(messageId)}&select=id&limit=1`,
        { method: "GET" },
        serviceKey
      );
      if (existing.length) { ignored += 1; continue; }

      const extracted = typeof item.ExtractedMarkdownMessage === "string" ? item.ExtractedMarkdownMessage.trim() : "";
      const rawText = typeof item.RawTextBody === "string" ? item.RawTextBody.trim() : "";
      const bodyText = (extracted || rawText).slice(0, 20000).trim();
      if (!bodyText) { ignored += 1; continue; }

      const subject = (typeof item.Subject === "string" ? item.Subject.trim() : "Reply").slice(0, 300) || "Reply";
      const receivedAt = new Date().toISOString();
      const sentAtRaw = typeof item.SentAtDate === "string" ? item.SentAtDate : "";
      const occurredAt = sentAtRaw && !Number.isNaN(Date.parse(sentAtRaw)) ? new Date(sentAtRaw).toISOString() : receivedAt;
      const spam = item.Spam && typeof item.Spam === "object" ? item.Spam as Record<string, unknown> : null;
      const spamScore = spam && typeof spam.Score === "number" ? spam.Score : null;

      const inserted = await serviceJson<Array<{ id: string }>>(
        `${supabaseUrl}/rest/v1/email_messages?select=id`,
        {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            workspace_id: thread.workspace_id,
            booking_id: thread.booking_id,
            contact_id: thread.contact_id,
            direction: "inbound",
            to_email: route.recipient,
            from_email: fromEmail,
            subject,
            body_text: bodyText,
            status: "received",
            provider: "brevo",
            provider_message_id: messageId,
            received_at: receivedAt,
            created_by: thread.created_by
          })
        },
        serviceKey
      );
      const emailMessageId = inserted[0]?.id;
      if (!emailMessageId) throw new Error("inbound_email_insert_failed");

      await serviceJson(
        `${supabaseUrl}/rest/v1/activities`,
        {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            workspace_id: thread.workspace_id,
            booking_id: thread.booking_id,
            type: "email",
            direction: "inbound",
            contact_id: thread.contact_id,
            actor_user_id: null,
            body: bodyText,
            metadata: {
              email_message_id: emailMessageId,
              subject,
              from_email: fromEmail,
              provider: "brevo",
              provider_message_id: messageId,
              in_reply_to: typeof item.InReplyTo === "string" ? item.InReplyTo : null,
              spam_score: spamScore,
              ingested_by: "brevo_inbound"
            },
            visibility: "workspace",
            occurred_at: occurredAt,
            created_by: thread.created_by
          })
        },
        serviceKey
      );

      accepted += 1;
    }

    return json({ accepted, ignored });
  } catch (error) {
    console.error("ingest-booking-email", error);
    return json({ error: "inbound_email_ingest_failed" }, 500);
  }
});
