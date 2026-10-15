// Dedicated recovery of files from a previously created booking.
// Do not re-run AI classification or create another booking.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const secret = Deno.env.get("MAILBOX_WORKER_SECRET");
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return json({ error: "unauthorized" }, 401);
  }
  const base = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!base || !serviceKey) return json({ error: "not_configured" }, 503);
  let jobId: string;
  try {
    const body = await request.json();
    jobId = String(body.job_id || "");
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(jobId)) {
    return json({ error: "invalid_job_id" }, 400);
  }
  async function db<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${base}/rest/v1/${path}`, {
      ...init,
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, ...init.headers },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error("database_unavailable");
    return await response.json() as T;
  }
  try {
    const jobs = await db<Array<{ connection_id: string; message_id: string; booking_id: string; consent_revision: number }>>(
      `mailbox_incoming_jobs?id=eq.${jobId}&state=eq.completed&classification_kind=eq.booking&select=connection_id,message_id,booking_id,consent_revision&limit=1`
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
    return json({ ready: true, booking_id: job.booking_id, connection_id: connection.id, message_id: job.message_id });
  } catch {
    return json({ error: "recovery_preflight_failed" }, 503);
  }
});
