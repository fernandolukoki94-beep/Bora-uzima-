const MAX_BODY_BYTES = 8 * 1024;
const ALLOWED_KEYS = new Set([
  "takeId",
  "genre",
  "vocalPreset",
  "durationSeconds",
  "bpm",
  "key",
  "locale",
  "intent",
]);

const ADVICE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    chain: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
  },
  required: ["summary", "chain", "confidence"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = "És um mini-produtor musical responsável. Analisa a intenção do artista, BPM, tonalidade e preset. Responde exclusivamente em JSON com summary, chain e confidence. A tua resposta será executada pelo Producer Studio: arranjo e instrumentalização entram na timeline, a cadeia vocal orienta DSP local reversível, e mix/master são executados localmente com headroom. Não afirmes que processaste áudio no servidor.";

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8").end(JSON.stringify(body));
}

function validate(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return "Pedido inválido.";
  for (const key of Object.keys(input)) if (!ALLOWED_KEYS.has(key)) return `Campo não permitido: ${key}.`;
  if (typeof input.takeId !== "string" || input.takeId.length < 1 || input.takeId.length > 128) return "takeId inválido.";
  if (typeof input.genre !== "string" || input.genre.length < 1 || input.genre.length > 80) return "genre inválido.";
  if (typeof input.vocalPreset !== "string" || input.vocalPreset.length < 1 || input.vocalPreset.length > 80) return "vocalPreset inválido.";
  if (!Number.isFinite(input.durationSeconds) || input.durationSeconds < 0 || input.durationSeconds > 3600) return "durationSeconds inválido.";
  if (input.bpm !== undefined && (!Number.isFinite(input.bpm) || input.bpm < 40 || input.bpm > 240)) return "bpm inválido.";
  if (input.key !== undefined && (typeof input.key !== "string" || input.key.length < 1 || input.key.length > 24)) return "key inválido.";
  if (typeof input.locale !== "string" || input.locale.length < 2 || input.locale.length > 16) return "locale inválido.";
  if (typeof input.intent !== "string" || input.intent.length > 240) return "intent inválido.";
  return null;
}

function validateAdvice(advice) {
  if (!advice || typeof advice !== "object" || Array.isArray(advice)) return "Resposta IA inválida.";
  if (typeof advice.summary !== "string" || advice.summary.trim().length < 1 || advice.summary.length > 500) return "summary inválido.";
  if (!Array.isArray(advice.chain) || advice.chain.length < 1 || advice.chain.length > 6) return "chain inválida.";
  if (advice.chain.some((item) => typeof item !== "string" || item.trim().length < 1 || item.length > 120)) return "item chain inválido.";
  if (!["low", "medium", "high"].includes(advice.confidence)) return "confidence inválida.";
  return null;
}

function userPayload(input) {
  return JSON.stringify({ ...input, policy: "metadata-only; no audio uploaded" });
}

function openAiPayload(input) {
  return {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPayload(input) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "production_advice", strict: true, schema: ADVICE_SCHEMA },
    },
    model: process.env.AI_MODEL || "gpt-4o-mini",
  };
}

function geminiPayload(input) {
  return {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: userPayload(input) }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: ADVICE_SCHEMA,
      temperature: 0.2,
    },
  };
}

function parseJsonContent(content) {
  if (typeof content !== "string") return content;
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(cleaned);
}

function providerConfig() {
  if (process.env.GEMINI_API_KEY) {
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const base = process.env.GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1beta/models";
    return {
      kind: "gemini",
      key: process.env.GEMINI_API_KEY,
      url: `${base.replace(/\/$/, "")}/${model}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
      body: geminiPayload,
    };
  }
  const key = process.env.AI_PROVIDER_KEY || process.env.OPENAI_API_KEY;
  if (!key) return null;
  return {
    kind: "openai",
    key,
    url: process.env.AI_PROVIDER_URL || "https://api.openai.com/v1/chat/completions",
    body: openAiPayload,
  };
}

function extractProviderContent(kind, result) {
  if (kind === "gemini") return result?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
  return result?.choices?.[0]?.message?.content;
}

function providerStatus(response) {
  if (response.status === 429) return "provider_quota_exhausted";
  if (response.status === 401 || response.status === 403) return "provider_auth_failed";
  return "provider_unavailable";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { status: "method_not_allowed" });
  }

  const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return json(res, 413, { status: "payload_too_large" });

  let input;
  try { input = JSON.parse(raw); } catch { return json(res, 400, { status: "invalid_request", message: "JSON inválido." }); }
  const validationError = validate(input);
  if (validationError) return json(res, 400, { status: "invalid_request", message: validationError });

  const provider = providerConfig();
  if (!provider) return json(res, 503, { status: "provider_unavailable", message: "Assistência IA server-side ainda não configurada; o fluxo local continua disponível." });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(provider.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(provider.kind === "openai" ? { Authorization: `Bearer ${provider.key}` } : {}) },
      body: JSON.stringify(provider.body(input)),
      signal: controller.signal,
    });
    if (!response.ok) return json(res, 503, { status: providerStatus(response) });
    const result = await response.json();
    const advice = parseJsonContent(extractProviderContent(provider.kind, result));
    const adviceError = validateAdvice(advice);
    if (adviceError) return json(res, 502, { status: "invalid_provider_response" });
    return json(res, 200, {
      requestId: crypto.randomUUID(),
      status: "ready",
      provider: provider.kind,
      advice,
      disclaimer: "A IA define o plano de produção; o Producer Studio materializa arranjo, vocal, mix e master localmente, preservando o Original.",
    });
  } catch {
    return json(res, 503, { status: "provider_unavailable", message: "A recomendação IA está temporariamente indisponível; nada local foi alterado." });
  } finally {
    clearTimeout(timeout);
  }
}
