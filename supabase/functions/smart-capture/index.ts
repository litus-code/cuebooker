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

function outputText(payload: any) {
  if (typeof payload?.output_text === "string") return payload.output_text;
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && typeof content?.text === "string") return content.text;
    }
  }
  return "";
}

async function transcribeAudio(apiKey: string, file: File, locale: "es" | "en") {
  if (file.size <= 0 || file.size > 20 * 1024 * 1024) throw new Error("invalid_audio_size");
  const allowed = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-m4a", "audio/ogg"];
  if (file.type && !allowed.some(type => file.type.startsWith(type))) throw new Error("unsupported_audio_type");

  const form = new FormData();
  form.set("model", Deno.env.get("CUEBOOKER_TRANSCRIPTION_MODEL")?.trim() || "gpt-4o-transcribe");
  form.set("language", locale);
  form.set(
    "prompt",
    locale === "es"
      ? "Contexto: bookings de DJs, promotores, salas, festivales, fechas, horarios, fees, hospitality, viajes y nombres propios de la escena electrónica."
      : "Context: DJ bookings, promoters, venues, festivals, dates, schedules, fees, hospitality, travel and electronic-music proper names."
  );
  form.set("file", file, file.name || "cuebooker-capture.webm");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form
  });
  const text = await response.text();
  if (!response.ok) {
    console.error("smart-capture transcription provider", response.status);
    throw new Error(`transcription_provider_${response.status}`);
  }

  let parsed: any;
  try { parsed = JSON.parse(text); } catch { throw new Error("transcription_invalid_response"); }
  const transcript = String(parsed?.text || "").trim();
  if (!transcript) throw new Error("transcription_empty");
  if (transcript.length > 20000) throw new Error("transcription_too_long");
  return transcript;
}

async function extractBooking(apiKey: string, transcript: string, locale: "es" | "en") {
  const currentDate = new Date().toISOString();
  const system = `
You extract booking information for Cuebooker, a professional DJ booking workflow.

Rules:
- Never invent facts.
- If a value is not explicitly stated or cannot be safely normalized, return null with confidence "unknown".
- "high" means explicitly stated and unambiguous.
- "medium" means strongly implied but worth checking.
- "low" means plausible but ambiguous; use sparingly.
- Evidence must be a short exact fragment from the supplied text. Never fabricate evidence.
- Normalize dates to YYYY-MM-DD only when the date can be resolved.
- Normalize times to HH:MM only when explicitly stated.
- Money must be integer minor units: 1500 EUR -> 150000.
- countryCode uses ISO-3166 alpha-2 only when clear.
- currency uses ISO-4217.
- Preserve conditions such as hotel, travel, hospitality, technical requirements or other commercial terms.
- nextAction is an actual follow-up action, not a summary.
- missingFields should list useful booking fields that remain unknown, not every possible field.
- warnings should call out contradictions, ambiguity or risky assumptions.
- Do not decide that a booking is confirmed, rejected or cancelled.
- Return content in ${locale === "es" ? "Spanish" : "English"} where natural-language strings are needed.
- Current UTC timestamp is ${currentDate}.
`.trim();

  const body = {
    model: Deno.env.get("CUEBOOKER_SMART_CAPTURE_MODEL")?.trim() || "gpt-5-mini",
    input: [
      { role: "system", content: [{ type: "input_text", text: system }] },
      { role: "user", content: [{ type: "input_text", text: transcript }] }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "cuebooker_smart_capture",
        strict: true,
        schema: extractionSchema
      }
    }
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  if (!response.ok) {
    console.error("smart-capture extraction provider", response.status);
    throw new Error(`extraction_provider_${response.status}`);
  }

  let parsedResponse: any;
  try { parsedResponse = JSON.parse(text); } catch { throw new Error("extraction_invalid_response"); }
  const structuredText = outputText(parsedResponse);
  if (!structuredText) throw new Error("extraction_empty");

  let structured: any;
  try { structured = JSON.parse(structuredText); } catch { throw new Error("extraction_invalid_json"); }
  return normalizeEvidence(structured);
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

  try {
    const contentType = request.headers.get("content-type") || "";
    let mode = "";
    let workspaceId = "";
    let artistId = "";
    let locale: "es" | "en" = "es";
    let transcript = "";

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

      const apiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
      if (!apiKey) return json({ error: "smart_capture_provider_not_configured" }, 503);
      transcript = await transcribeAudio(apiKey, audio, locale);

      const structured = await extractBooking(apiKey, transcript, locale);
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

    const apiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
    if (!apiKey) return json({ error: "smart_capture_provider_not_configured" }, 503);

    const structured = await extractBooking(apiKey, transcript, locale);
    return json({ transcript, ...(structured as Record<string, unknown>) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "smart_capture_failed";
    console.error("smart-capture", code);
    if (code === "invalid_audio_size" || code === "unsupported_audio_type" || code === "transcription_too_long") {
      return json({ error: code }, 400);
    }
    if (code.startsWith("transcription_provider_") || code.startsWith("extraction_provider_")) {
      return json({ error: "smart_capture_provider_failed" }, 502);
    }
    return json({ error: "smart_capture_failed" }, 500);
  }
});
