import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createGroqCaptureProvider, SmartCaptureProviderError } from "../_shared/smartCaptureProvider.ts";

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

async function rest<T>(url: string, token: string, anonKey: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`supabase_${response.status}`);
  return (text ? JSON.parse(text) : null) as T;
}

async function rpc<T>(
  supabaseUrl: string,
  token: string,
  anonKey: string,
  name: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`supabase_rpc_${response.status}`);
  return (text ? JSON.parse(text) : null) as T;
}

type SmartCaptureQuota = {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  reset_at: string;
};

async function reserveSmartCaptureUse(accessToken: string) {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const anonKey = requiredEnv("SUPABASE_ANON_KEY");
  return rpc<SmartCaptureQuota>(
    supabaseUrl,
    accessToken,
    anonKey,
    "reserve_smart_capture_monthly_use",
    { monthly_limit: 10 }
  );
}

const confidenceSchema = {
  type: "string",
  enum: ["high", "medium", "low", "unknown"]
};

function fieldSchema(valueSchema: Record<string, unknown>) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      value: valueSchema,
      confidence: confidenceSchema,
      evidence: { type: ["string", "null"] }
    },
    required: ["value", "confidence", "evidence"]
  };
}

const extractionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    source: fieldSchema({
      type: ["string", "null"],
      enum: ["booking_form", "phone", "whatsapp", "email", "instagram", "in_person", "manager", "manual", "other", null]
    }),
    contact: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: fieldSchema({ type: ["string", "null"] }),
        email: fieldSchema({ type: ["string", "null"] }),
        phone: fieldSchema({ type: ["string", "null"] })
      },
      required: ["name", "email", "phone"]
    },
    counterparty: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: fieldSchema({ type: ["string", "null"] }),
        kind: fieldSchema({
          type: ["string", "null"],
          enum: ["venue", "promoter", "festival", "agency", "brand", "other", null]
        })
      },
      required: ["name", "kind"]
    },
    event: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: fieldSchema({ type: ["string", "null"] }),
        venueName: fieldSchema({ type: ["string", "null"] }),
        city: fieldSchema({ type: ["string", "null"] }),
        countryCode: fieldSchema({ type: ["string", "null"] }),
        eventDate: fieldSchema({ type: ["string", "null"] }),
        startTime: fieldSchema({ type: ["string", "null"] }),
        endTime: fieldSchema({ type: ["string", "null"] }),
        timezone: fieldSchema({ type: ["string", "null"] })
      },
      required: ["name", "venueName", "city", "countryCode", "eventDate", "startTime", "endTime", "timezone"]
    },
    offer: {
      type: "object",
      additionalProperties: false,
      properties: {
        amountMinor: fieldSchema({ type: ["integer", "null"] }),
        currency: fieldSchema({ type: ["string", "null"] }),
        feeBasis: fieldSchema({ type: ["string", "null"] })
      },
      required: ["amountMinor", "currency", "feeBasis"]
    },
    nextAction: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: fieldSchema({ type: ["string", "null"] }),
        dueAt: fieldSchema({ type: ["string", "null"] })
      },
      required: ["label", "dueAt"]
    },
    conditions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: { type: "string", enum: ["travel", "hotel", "hospitality", "technical", "other"] },
          value: { type: "string" },
          confidence: confidenceSchema,
          evidence: { type: ["string", "null"] }
        },
        required: ["category", "value", "confidence", "evidence"]
      }
    },
    missingFields: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } }
  },
  required: [
    "summary", "source", "contact", "counterparty", "event", "offer",
    "nextAction", "conditions", "missingFields", "warnings"
  ]
};

function trimEvidence(value: unknown) {
  if (typeof value !== "string") return value;
  return value.length > 180 ? value.slice(0, 177) + "..." : value;
}

function normalizeEvidence(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(normalizeEvidence);
  if (!node || typeof node !== "object") return node;
  const copy: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    copy[key] = key === "evidence" ? trimEvidence(value) : normalizeEvidence(value);
  }
  return copy;
}

async function authorize(accessToken: string, workspaceId: string, artistId: string) {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const anonKey = requiredEnv("SUPABASE_ANON_KEY");

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` }
  });
  if (!userResponse.ok) return { ok: false as const, status: 401, error: "authentication_required" };
  const user = await userResponse.json();
  const userId = String(user?.id || "");
  if (!userId) return { ok: false as const, status: 401, error: "authentication_required" };

  const memberships = await rest<Array<{ role: string }>>(
    `${supabaseUrl}/rest/v1/workspace_members?workspace_id=eq.${encodeURIComponent(workspaceId)}&user_id=eq.${encodeURIComponent(userId)}&select=role&limit=1`,
    accessToken,
    anonKey
  );
  const role = memberships[0]?.role;
  if (!role || !["owner", "admin", "manager", "editor"].includes(role)) {
    return { ok: false as const, status: 403, error: "workspace_edit_permission_required" };
  }

  const artists = await rest<Array<{ artist_id: string }>>(
    `${supabaseUrl}/rest/v1/workspace_artists?workspace_id=eq.${encodeURIComponent(workspaceId)}&artist_id=eq.${encodeURIComponent(artistId)}&select=artist_id&limit=1`,
    accessToken,
    anonKey
  );
  if (!artists.length) return { ok: false as const, status: 404, error: "artist_not_in_workspace" };

  return { ok: true as const };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authorization = request.headers.get("Authorization") || "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) return json({ error: "authentication_required" }, 401);

  let transcript = "";
  let extractionStarted = false;
  try {
    const contentType = request.headers.get("content-type") || "";
    let mode = "";
    let workspaceId = "";
    let artistId = "";
    let locale: "es" | "en" = "es";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      mode = String(form.get("mode") || "");
      workspaceId = String(form.get("workspaceId") || "").trim();
      artistId = String(form.get("artistId") || "").trim();
      locale = String(form.get("locale") || "") === "en" ? "en" : "es";
      const audio = form.get("audio");
      if (mode !== "audio" || !(audio instanceof File)) return json({ error: "invalid_audio_payload" }, 400);

      const auth = await authorize(accessToken, workspaceId, artistId);
      if (!auth.ok) return json({ error: auth.error }, auth.status);

      const quota = await reserveSmartCaptureUse(accessToken);
      if (!quota.allowed) {
        return json({
          error: "smart_capture_monthly_limit_reached",
          quota
        }, 429);
      }

      const apiKey = Deno.env.get("GROQ_API_KEY")?.trim();
      if (!apiKey) return json({ error: "smart_capture_provider_not_configured" }, 503);
      const provider = createGroqCaptureProvider({ apiKey,
        transcriptionModel: Deno.env.get("CUEBOOKER_GROQ_TRANSCRIPTION_MODEL"),
        extractionModel: Deno.env.get("CUEBOOKER_GROQ_CAPTURE_MODEL") });
      transcript = await provider.transcribeAudio(audio, locale);
      extractionStarted = true;
      const structured = normalizeEvidence(await provider.extractBooking(transcript, locale, extractionSchema));
      return json({ transcript, ...(structured as Record<string, unknown>) });
    }

    let payload: any;
    try { payload = await request.json(); } catch { return json({ error: "invalid_json" }, 400); }

    mode = String(payload?.mode || "");
    workspaceId = String(payload?.workspaceId || "").trim();
    artistId = String(payload?.artistId || "").trim();
    locale = payload?.locale === "en" ? "en" : "es";
    transcript = String(payload?.text || "").trim();

    if (mode !== "text" || !workspaceId || !artistId || !transcript) {
      return json({ error: "invalid_text_payload" }, 400);
    }
    if (transcript.length > 20000) return json({ error: "text_too_long" }, 400);

    const auth = await authorize(accessToken, workspaceId, artistId);
    if (!auth.ok) return json({ error: auth.error }, auth.status);

    const quota = await reserveSmartCaptureUse(accessToken);
    if (!quota.allowed) {
      return json({
        error: "smart_capture_monthly_limit_reached",
        quota
      }, 429);
    }

    const apiKey = Deno.env.get("GROQ_API_KEY")?.trim();
    if (!apiKey) return json({ error: "smart_capture_provider_not_configured" }, 503);

    const provider = createGroqCaptureProvider({ apiKey, extractionModel: Deno.env.get("CUEBOOKER_GROQ_CAPTURE_MODEL") });
    extractionStarted = true;
    const structured = normalizeEvidence(await provider.extractBooking(transcript, locale, extractionSchema));
    return json({ transcript, ...(structured as Record<string, unknown>) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "smart_capture_failed";
    console.error("smart-capture", code);
    if (code === "invalid_audio_size" || code === "unsupported_audio_type" || code === "transcription_too_long") {
      return json({ error: code }, 400);
    }
    if (error instanceof SmartCaptureProviderError) {
      return json({ error: error.status === 429 ? "smart_capture_rate_limited" : `smart_capture_${error.stage}_failed`, stage: error.stage,
        ...(error.stage === "extraction" && transcript ? { transcript } : {}) }, error.status === 429 ? 429 : 502);
    }
    if (extractionStarted && transcript) return json({ error: "smart_capture_extraction_failed", stage: "extraction", transcript }, 502);
    return json({ error: "smart_capture_failed" }, 500);
  }
});
