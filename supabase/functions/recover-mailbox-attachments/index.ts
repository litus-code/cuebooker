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
  // Never process attachments until the job, owner consent and booking are validated.
  return json({ error: "recovery_not_ready" }, 503);
});
