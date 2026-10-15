// Dedicated recovery of files from a previously created booking.
// Do not re-run AI classification or create another booking.
import { mailboxAttachmentMime } from "../_shared/saveMailboxAttachments.ts";
import { mailboxTransport, gmailConfig } from "../_shared/mailboxTransport.ts";
import { gmailConfigured } from "../_shared/gmailMailbox.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, apikey, content-type", "access-control-allow-methods": "POST, OPTIONS" }
  });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, apikey, content-type", "access-control-allow-methods": "POST, OPTIONS" } });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const baseAuth = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const jwt = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!jwt || !baseAuth || !anonKey) return json({ error: "unauthorized" }, 401);
  const response = await fetch(`${baseAuth}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${jwt}` }
  }).catch(() => null);
  if (!response?.ok) return json({ error: "unauthorized" }, 401);
  const user = await response.json() as { id?: string };
  if (!user.id) return json({ error: "unauthorized" }, 401);
  const base = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!base || !serviceKey) return json({ error: "not_configured" }, 503);
  let bookingId: string;
  try {
    const body = await request.json();
    bookingId = String(body.booking_id || "");
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(bookingId)) {
    return json({ error: "invalid_job_id" }, 400);
  }
  async function db<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${base}/rest/v1/${path}`, {
      ...init,
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "content-type": "application/json", ...init.headers },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error("database_unavailable");
    return await response.json() as T;
  }
  try {
    // Use the caller JWT and booking RLS before any privileged mailbox lookup.
    const visible = await fetch(`${base}/rest/v1/bookings?id=eq.${bookingId}&select=id&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${jwt}` }, signal: AbortSignal.timeout(8000)
    });
    if (!visible.ok) return json({error:"booking_lookup_failed"},502);
    if (!(await visible.json()).length) return json({error:"booking_unavailable"},404);
    const jobs = await db<Array<{ connection_id: string; message_id: string; booking_id: string; consent_revision: number }>>(
      `mailbox_incoming_jobs?booking_id=eq.${bookingId}&state=eq.completed&classification_kind=eq.booking&select=connection_id,message_id,booking_id,consent_revision&limit=1`
    );
    const job = jobs[0];
    if (!job?.booking_id) return json({ error: "job_not_eligible" }, 404);
    const connections = await db<Array<{ id: string; workspace_id: string; user_id: string; email: string; transport: string }>>(
      `mailbox_connections?id=eq.${job.connection_id}&status=eq.connected&transport=eq.gmail&background_analysis_enabled=eq.true&background_analysis_revision=eq.${job.consent_revision}&select=id,workspace_id,user_id,email,transport&limit=1`
    );
    const connection = connections[0];
    if (!connection) return json({ error: "consent_unavailable" }, 403);
    const bookings = await db<Array<{ id: string }>>(
      `bookings?id=eq.${job.booking_id}&workspace_id=eq.${connection.workspace_id}&select=id&limit=1`
    );
    if (!bookings.length) return json({ error: "booking_unavailable" }, 404);
    const members = await db<Array<{user_id:string}>>(
      `workspace_members?workspace_id=eq.${connection.workspace_id}&user_id=eq.${connection.user_id}&role=in.(owner,admin,manager,editor)&select=user_id&limit=1`
    );
    if (!members.length) return json({ error: "member_access_revoked" }, 403);
    const requester = await db<Array<{user_id:string}>>(`workspace_members?workspace_id=eq.${connection.workspace_id}&user_id=eq.${user.id}&role=in.(owner,admin,manager,editor)&select=user_id&limit=1`);
    if (!requester.length) return json({ error: "forbidden" }, 403);
    if (Deno.env.get("CUEBOOKER_CONNECTED_ATTACHMENTS_ENABLED") !== "true" ||
        !gmailConfigured(gmailConfig(name => Deno.env.get(name)))) {
      return json({ error: "attachment_recovery_disabled" }, 503);
    }
    const authorize = async () => {
      if (Deno.env.get("CUEBOOKER_MAILBOX_ENABLED") !== "true" ||
          Deno.env.get("CUEBOOKER_MAILBOX_BACKGROUND_ENABLED") !== "true" ||
          Deno.env.get("CUEBOOKER_CONNECTED_ATTACHMENTS_ENABLED") !== "true") return false;
      const current = await db<Array<{background_analysis_since:string}>>(
        `mailbox_connections?id=eq.${connection.id}&workspace_id=eq.${connection.workspace_id}&user_id=eq.${connection.user_id}&status=eq.connected&transport=eq.gmail&background_analysis_enabled=eq.true&background_analysis_processor=eq.groq-gpt-oss-20b-v1&background_analysis_revision=eq.${job.consent_revision}&select=background_analysis_since&limit=1`
      );
      if (!current[0]) return false;
      const eligible = await db<Array<{message_date:string}>>(
        `mailbox_incoming_jobs?booking_id=eq.${bookingId}&connection_id=eq.${connection.id}&message_id=eq.${encodeURIComponent(job.message_id)}&consent_revision=eq.${job.consent_revision}&state=eq.completed&classification_kind=eq.booking&select=message_date&limit=1`
      );
      if (!eligible[0] || !(Date.parse(eligible[0].message_date)>=Date.parse(current[0].background_analysis_since))) return false;
      for (const actor of new Set([connection.user_id,user.id])) {
        const member = await db<Array<{user_id:string}>>(`workspace_members?workspace_id=eq.${connection.workspace_id}&user_id=eq.${actor}&role=in.(owner,admin,manager,editor)&select=user_id&limit=1`);
        if (!member.length) return false;
      }
      return true;
    };
    if (!await authorize()) return json({error:"consent_unavailable"},403);
    const messages = await db<Array<{id:string}>>(`email_messages?workspace_id=eq.${connection.workspace_id}&booking_id=eq.${bookingId}&provider=eq.${encodeURIComponent('nylas:'+connection.id)}&provider_message_id=eq.${encodeURIComponent(job.message_id)}&direction=eq.inbound&select=id&limit=1`);
    if (!messages[0]) return json({error:"message_unavailable"},404);
    const emailMessageId = messages[0].id;
    const provider = mailboxTransport(connection, name => Deno.env.get(name), db);
    if (!("attachment" in provider)) return json({ error: "unsupported_provider" }, 422);
    const message = await provider.message("", job.message_id);
    if (message.id !== job.message_id) return json({ error: "message_mismatch" }, 422);
    const files = Array.isArray(message.attachments) ? message.attachments.slice(0, 10) : [];
    const outcomes: Array<{ index: number; status: string }> = [];
    for (const [index, file] of files.entries()) {
      if (!file || typeof file.id !== "string" || typeof file.name !== "string" ||
          !Number.isInteger(file.size) || file.size < 1 || file.size > 5242880) {
        outcomes.push({ index, status: "unsupported_metadata" });
        continue;
      }
      try {
        if (!await authorize()) { outcomes.push({index,status:"consent_unavailable"}); break; }
        const existing = await db<Array<{id:string}>>(
          `booking_email_attachments?workspace_id=eq.${connection.workspace_id}&booking_id=eq.${bookingId}&mailbox_connection_id=eq.${connection.id}&provider_message_id=eq.${encodeURIComponent(job.message_id)}&attachment_index=eq.${index}&select=id&limit=1`
        );
        if (existing.length) { outcomes.push({index,status:"already_stored"}); continue; }
        const bytes = await provider.attachment("", job.message_id, file.id);
        const mime = mailboxAttachmentMime(bytes);
        if (!mime || mime !== file.mime || !bytes.length || bytes.length !== file.size || bytes.length > 5242880) {
          outcomes.push({index,status:"unsupported_content"}); continue;
        }
        if (!await authorize()) { outcomes.push({index,status:"consent_unavailable"}); break; }
        const key = `${connection.workspace_id}/${connection.id}/${encodeURIComponent(job.message_id)}/${index}`;
        const upload = await fetch(`${base}/storage/v1/object/booking-email-attachments/${key}`,{
          method: "POST", headers: {apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":mime,"x-upsert":"true"},body:bytes
        });
        if (!upload.ok) throw new Error("storage_upload_failed");
        const name = file.name.replace(/[\\/\x00-\x1f]/g, "_").slice(0,200) || "Archivo";
        if (!await authorize()) { outcomes.push({index,status:"consent_unavailable"}); break; }
        const metadata = await fetch(`${base}/rest/v1/booking_email_attachments`,{
          method:"POST", headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json",Prefer:"return=minimal"},
          body:JSON.stringify({workspace_id:connection.workspace_id,booking_id:job.booking_id,mailbox_connection_id:connection.id,email_message_id:emailMessageId,
            provider_message_id:job.message_id,attachment_index:index,file_name:name,content_type:mime,byte_size:bytes.length,storage_path:key})
        });
        if (!metadata.ok) {
          if (metadata.status !== 409) throw new Error("metadata_write_failed");
          const saved = await db<Array<{id:string}>>(`booking_email_attachments?workspace_id=eq.${connection.workspace_id}&booking_id=eq.${bookingId}&mailbox_connection_id=eq.${connection.id}&provider_message_id=eq.${encodeURIComponent(job.message_id)}&attachment_index=eq.${index}&select=id&limit=1`);
          if (!saved.length) throw new Error("metadata_write_failed");
        }
        outcomes.push({index,status:metadata.ok?"stored":"already_stored"});
      } catch (error) {
        const reason = error instanceof Error ? error.message : "unexpected";
        const allowed = ["storage_upload_failed","metadata_write_failed","mailbox_provider_unavailable","invalid_attachment_payload","mailbox_not_found","attachment_too_large"];
        outcomes.push({index,status:allowed.includes(reason)?reason:"processing_failed"});
      }
    }
    return json({booking_id:job.booking_id, attachments:outcomes});
  } catch {
    return json({ error: "recovery_preflight_failed" }, 503);
  }
});

