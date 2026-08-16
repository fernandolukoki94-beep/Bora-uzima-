const MAX_BODY_BYTES = 8 * 1024;
const ALLOWED_KEYS = new Set([
  "takeId",
  "genre",
  "vocalPreset",
  "durationSeconds",
  "locale",
  "intent",
]);

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
  if (typeof input.locale !== "string" || input.locale.length < 2 || input.locale.length > 16) return "locale inválido.";
  if (typeof input.intent !== "string" || input.intent.length > 240) return "intent inválido.";
  return null;
}

function providerPayload(input) {
  return {
    messages: [
      {
        role: "system",
        content: "És um mini-produtor musical responsável. Responde em JSON com summary, chain e confidence. Recomenda, não afirma que processaste áudio.",
      },
      {
        role: "user",
        content: JSON.stringify({ ...input, policy: "metadata-only; no audio uploaded" }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "production_advice",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            chain: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
          },
          required: ["summary", "chain", "confidence"],
          additionalProperties: false,
        },
      },
    },
  };
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

  const providerUrl = process.env.AI_PROVIDER_URL;
  const providerKey = process.env.AI_PROVIDER_KEY;
  if (!providerUrl || !providerKey) return json(res, 503, { status: "provider_unavailable", message: "Assistência IA server-side ainda não configurada; o fluxo local continua disponível." });

  try {
    const response = await fetch(providerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${providerKey}` },
      body: JSON.stringify(providerPayload(input)),
    });
    if (!response.ok) return json(res, 503, { status: "provider_unavailable" });
    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content;
    const advice = typeof content === "string" ? JSON.parse(content) : content;
    if (!advice || typeof advice.summary !== "string" || !Array.isArray(advice.chain)) throw new Error("Resposta IA inválida");
    return json(res, 200, {
      requestId: crypto.randomUUID(),
      status: "ready",
      advice,
      disclaimer: "Recomendação assistida; não é mixagem ou masterização automática.",
    });
  } catch {
    return json(res, 503, { status: "provider_unavailable", message: "A recomendação IA está temporariamente indisponível; nada local foi alterado." });
  }
}
