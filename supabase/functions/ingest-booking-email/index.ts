import "jsr:@supabase/functions-js/edge-runtime.d.ts";

function json(body: unknown, status = 200, requestId?: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...(requestId ? { "x-cuebooker-request-id": requestId } : {})
    }
  });
}

function logEvent(event: string, requestId: string, details: Record<string, unknown> = {}) {
  console.log(JSON.stringify({
    scope: "ingest-booking-email",
    event,
    request_id: requestId,
    ...details
  }));
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


const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
const ATTACHMENT_MAX_COUNT = 10;
const ATTACHMENT_ALLOWED = new Set(["application/pdf", "image/png", "image/jpeg"]);

function verifiedType(bytes: Uint8Array): string | null {
  if (bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-") return "application/pdf";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  return null;
}

async function limitedBytes(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("attachment_empty_response");
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > ATTACHMENT_MAX_BYTES) throw new Error("attachment_too_large");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

async function persistAttachments(
  item: Record<string, unknown>,
  messageId: string,
  emailMessageId: string,
  workspaceId: string,
  bookingId: string,
  supabaseUrl: string,
  serviceKey: string,
  requestId: string
) {
  // Off by default until the migration and an actual Brevo roundtrip are verified.
  if (Deno.env.get("CUEBOOKER_EMAIL_ATTACHMENTS_ENABLED") !== "true") return;
  const brevoKey = Deno.env.get("BREVO_API_KEY")?.trim();
  if (!brevoKey) throw new Error("missing_brevo_api_key");
  const attachments = Array.isArray(item.Attachments) ? item.Attachments : [];
  for (const [index, unknownAttachment] of attachments.slice(0, ATTACHMENT_MAX_COUNT).entries()) {
    const attachment = unknownAttachment && typeof unknownAttachment === "object"
      ? unknownAttachment as Record<string, unknown> : {};
    const token = typeof attachment.DownloadToken === "string" ? attachment.DownloadToken.trim() : "";
    const claimedType = typeof attachment.ContentType === "string" ? attachment.ContentType.toLowerCase().split(";")[0].trim() : "";
    const declaredSize = Number(attachment.ContentLength);
    if (!token || !ATTACHMENT_ALLOWED.has(claimedType) || !Number.isFinite(declaredSize) || declaredSize < 1 || declaredSize > ATTACHMENT_MAX_BYTES) {
      logEvent("attachment_skipped", requestId, { reason: "invalid_type_size_or_token", index });
      continue;
    }
    // Provider retries must not create a second object or DB record.
    const existing = await serviceJson<Array<{ id: string }>>(
      `${supabaseUrl}/rest/v1/booking_email_attachments?email_message_id=eq.${encodeURIComponent(emailMessageId)}&attachment_index=eq.${index}&select=id&limit=1`,
      { method: "GET" }, serviceKey
    );
    if (existing.length) continue;
    try {
      const response = await fetch(`https://api.brevo.com/v3/inbound/attachments/${encodeURIComponent(token)}`, {
        headers: { "api-key": brevoKey }
      });
      if (!response.ok) throw new Error(`attachment_fetch_${response.status}`);
      const bytes = await limitedBytes(response);
      const detectedType = verifiedType(bytes);
      if (!detectedType || detectedType !== claimedType || bytes.length === 0) throw new Error("attachment_content_mismatch");
      const rawName = typeof attachment.Name === "string" ? attachment.Name : "attachment";
      const fileName = rawName.replace(/[\\/\x00-\x1f]/g, "_").slice(0, 200) || "attachment";
      const path = `${workspaceId}/${emailMessageId}/${index}`;
      const upload = await fetch(`${supabaseUrl}/storage/v1/object/booking-email-attachments/${path}`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": detectedType,
          "x-upsert": "true"
        },
        body: bytes
      });
      if (!upload.ok) throw new Error(`attachment_storage_${upload.status}`);
      await serviceJson(`${supabaseUrl}/rest/v1/booking_email_attachments?on_conflict=email_message_id,attachment_index`, {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({
          workspace_id: workspaceId, booking_id: bookingId, email_message_id: emailMessageId,
          attachment_index: index, file_name: fileName, content_type: detectedType,
          byte_size: bytes.length, storage_path: path
        })
      }, serviceKey);
      logEvent("attachment_stored", requestId, { index, bytes: bytes.length });
    } catch (error) {
      logEvent("attachment_failed", requestId, { index, reason: error instanceof Error ? error.message.slice(0, 90) : "unknown" });
      // Leave the parent mail/Activity intact. A provider retry may resume this file.
    }
  }
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

Deno.serve(async (request) => {
  const requestId = request.headers.get("x-cuebooker-request-id")?.trim() || crypto.randomUUID();

  if (request.method !== "POST") {
    logEvent("method_rejected", requestId, { method: request.method });
    return json({ error: "method_not_allowed", requestId }, 405, requestId);
  }

  const configuredSecret = Deno.env.get("CUEBOOKER_INBOUND_WEBHOOK_SECRET")?.trim();
  if (!configuredSecret) {
    logEvent("webhook_not_configured", requestId);
    return json({ error: "webhook_not_configured", requestId }, 503, requestId);
  }

  const suppliedSecret = request.headers.get("x-cuebooker-webhook-secret")?.trim();
  if (!suppliedSecret || suppliedSecret !== configuredSecret) {
    logEvent("webhook_auth_failed", requestId, { has_supplied_secret: Boolean(suppliedSecret) });
    return json({ error: "unauthorized_webhook", requestId }, 401, requestId);
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    logEvent("invalid_json", requestId);
    return json({ error: "invalid_json", requestId }, 400, requestId);
  }

  const allItems = Array.isArray(payload?.items) ? payload.items : [];
  if (!allItems.length) {
    logEvent("empty_batch", requestId);
    return json({ accepted: 0, ignored: 0, requestId }, 200, requestId);
  }

  const items = allItems.slice(0, 50);
  let accepted = 0;
  let ignored = Math.max(0, allItems.length - items.length);

  logEvent("batch_started", requestId, {
    received: allItems.length,
    processing: items.length,
    truncated: allItems.length - items.length
  });

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    for (const rawItem of items) {
      const item = rawItem && typeof rawItem === "object" ? rawItem as Record<string, unknown> : {};
      const route = extractReplyToken(item);
      if (!route) {
        ignored += 1;
        logEvent("item_ignored", requestId, { reason: "reply_token_missing" });
        continue;
      }

      const messageId = typeof item.MessageId === "string" ? item.MessageId.trim() : "";
      if (!messageId) {
        ignored += 1;
        logEvent("item_ignored", requestId, { reason: "provider_message_id_missing" });
        continue;
      }

      const threadRows = await serviceJson<Array<{
        id: string;
        workspace_id: string;
        booking_id: string;
        contact_id: string;
        to_email: string;
        created_by: string | null;
      }>>(
        `${supabaseUrl}/rest/v1/email_messages?reply_token=eq.${encodeURIComponent(route.token)}&direction=eq.outbound&select=id,workspace_id,booking_id,contact_id,to_email,created_by&order=created_at.desc&limit=1`,
        { method: "GET" },
        serviceKey
      );
      const thread = threadRows[0];
      if (!thread) {
        ignored += 1;
        logEvent("item_ignored", requestId, { reason: "thread_not_found" });
        continue;
      }

      const fromEmail = mailboxAddress(item.From)?.toLowerCase() || "";
      if (!fromEmail || fromEmail !== thread.to_email.trim().toLowerCase()) {
        ignored += 1;
        logEvent("item_ignored", requestId, {
          reason: "sender_mismatch",
          booking_id: thread.booking_id
        });
        continue;
      }

      const extracted = typeof item.ExtractedMarkdownMessage === "string" ? item.ExtractedMarkdownMessage.trim() : "";
      const rawText = typeof item.RawTextBody === "string" ? item.RawTextBody.trim() : "";
      const bodyText = (extracted || rawText).slice(0, 20000).trim();
      if (!bodyText) {
        ignored += 1;
        logEvent("item_ignored", requestId, {
          reason: "body_empty",
          booking_id: thread.booking_id
        });
        continue;
      }

      const subject = (typeof item.Subject === "string" ? item.Subject.trim() : "Reply").slice(0, 300) || "Reply";
      const receivedAt = new Date().toISOString();
      const sentAtRaw = typeof item.SentAtDate === "string" ? item.SentAtDate : "";
      const occurredAt = sentAtRaw && !Number.isNaN(Date.parse(sentAtRaw)) ? new Date(sentAtRaw).toISOString() : receivedAt;
      const spam = item.Spam && typeof item.Spam === "object" ? item.Spam as Record<string, unknown> : null;
      const spamScore = spam && typeof spam.Score === "number" ? spam.Score : null;

      const rows = await serviceJson<Array<{
        email_message_id: string;
        email_created: boolean;
        activity_created: boolean;
      }>>(
        `${supabaseUrl}/rest/v1/rpc/ingest_booking_email_message`,
        {
          method: "POST",
          body: JSON.stringify({
            target_workspace_id: thread.workspace_id,
            target_booking_id: thread.booking_id,
            target_contact_id: thread.contact_id,
            target_to_email: route.recipient,
            target_from_email: fromEmail,
            target_subject: subject,
            target_body_text: bodyText,
            target_provider: "brevo",
            target_provider_message_id: messageId,
            target_received_at: receivedAt,
            target_occurred_at: occurredAt,
            target_created_by: thread.created_by,
            target_metadata: {
              subject,
              in_reply_to: typeof item.InReplyTo === "string" ? item.InReplyTo : null,
              spam_score: spamScore,
              reply_recipient: route.recipient,
              ingest_request_id: requestId
            }
          })
        },
        serviceKey
      );

      const result = rows[0];
      if (result?.email_message_id) {
        await persistAttachments(item, messageId, result.email_message_id, thread.workspace_id, thread.booking_id, supabaseUrl, serviceKey, requestId);
      }
      if (result?.email_created || result?.activity_created) {
        accepted += 1;
        logEvent("item_accepted", requestId, {
          booking_id: thread.booking_id,
          email_created: Boolean(result.email_created),
          activity_created: Boolean(result.activity_created)
        });
      } else {
        ignored += 1;
        logEvent("item_ignored", requestId, {
          reason: "idempotent_or_noop",
          booking_id: thread.booking_id
        });
      }
    }

    logEvent("batch_completed", requestId, { accepted, ignored });

    if (accepted > 0) {
      dispatchNotificationEmails(supabaseUrl, serviceKey);
    }

    return json({ accepted, ignored, requestId }, 200, requestId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logEvent("batch_failed", requestId, {
      error_code: message.split(":")[0].slice(0, 120)
    });
    console.error("ingest-booking-email", requestId, error);
    return json({ error: "inbound_email_ingest_failed", requestId }, 500, requestId);
  }
});
