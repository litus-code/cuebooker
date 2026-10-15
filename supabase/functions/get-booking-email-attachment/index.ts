
// POST { attachment_id }, Authorization: Bearer <user access token>
// Return a 60-second signed URL only after a workspace-scoped RLS read.
function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, apikey, content-type", "access-control-allow-methods": "POST, OPTIONS" }
  });
}
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, apikey, content-type", "access-control-allow-methods": "POST, OPTIONS" } });
  if (request.method !== "POST") return respond({ error: "method_not_allowed" }, 405);
  const jwt = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!jwt) return respond({ error: "unauthorized" }, 401);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
  const publicKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !publicKey || !serviceKey) return respond({ error: "not_configured" }, 503);
  let id = "";
  try { const body = await request.json(); id = typeof body?.attachment_id === "string" ? body.attachment_id : ""; }
  catch { return respond({ error: "invalid_json" }, 400); }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return respond({ error: "invalid_attachment_id" }, 400);
  }
  try {
    // Authenticate token with the auth server. Never use service-role for the RLS read.
    const auth = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: {
      apikey: publicKey, Authorization: `Bearer ${jwt}`
    } });
    if (!auth.ok) return respond({ error: "unauthorized" }, 401);
    const lookup = await fetch(
      `${supabaseUrl}/rest/v1/booking_email_attachments?id=eq.${id}&select=storage_path,file_name&limit=1`,
      { headers: { apikey: publicKey, Authorization: `Bearer ${jwt}` } }
    );
    if (!lookup.ok) return respond({ error: "attachment_lookup_failed" }, 502);
    const rows = await lookup.json() as Array<{ storage_path: string; file_name: string }>;
    const attachment = rows[0];
    if (!attachment) return respond({ error: "not_found" }, 404);
    const sign = await fetch(
      `${supabaseUrl}/storage/v1/object/sign/booking-email-attachments/${attachment.storage_path}`,
      { method: "POST", headers: {
        apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "content-type": "application/json"
      }, body: JSON.stringify({ expiresIn: 60 }) }
    );
    if (!sign.ok) return respond({ error: "attachment_unavailable" }, 502);
    const result = await sign.json() as { signedURL?: string; signedUrl?: string };
    const signedPath = result.signedURL || result.signedUrl;
    if (!signedPath || !signedPath.startsWith("/")) return respond({ error: "sign_failed" }, 502);
    return respond({ url: `${supabaseUrl}/storage/v1${signedPath}`, file_name: attachment.file_name, expires_in: 60 });
  } catch {
    return respond({ error: "attachment_access_failed" }, 500);
  }
});

