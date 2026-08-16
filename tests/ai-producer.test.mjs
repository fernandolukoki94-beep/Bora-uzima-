import assert from "node:assert/strict";
import test from "node:test";
import handler from "../api/v1/production/advice.js";
import { requestProductionAdvice } from "../src/js/ai-producer-client.js";

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(value) { this.statusCode = value; return this; },
    end(value) { this.body = JSON.parse(value); },
  };
}

async function withEnv(values, callback) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try { return await callback(); } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

const validInput = {
  takeId: "take-1",
  genre: "Afrobeat",
  vocalPreset: "Natural",
  durationSeconds: 42,
  locale: "pt-PT",
  intent: "demo vocal",
};

test("IA server-side rejeita campos desconhecidos", async () => {
  const res = mockResponse();
  await handler({ method: "POST", body: { ...validInput, audio: "data:audio/wav;base64,..." } }, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.status, "invalid_request");
});

test("IA server-side não altera o fluxo quando o provedor não está configurado", async () => {
  await withEnv({ AI_PROVIDER_URL: undefined, AI_PROVIDER_KEY: undefined, OPENAI_API_KEY: undefined }, async () => {
    const res = mockResponse();
    await handler({ method: "POST", body: validInput }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.status, "provider_unavailable");
  });
});

test("IA server-side rejeita resposta com confidence, chain ou tamanhos inválidos", async () => {
  const originalFetch = globalThis.fetch;
  await withEnv({ AI_PROVIDER_URL: "https://provider.test", AI_PROVIDER_KEY: "test-key" }, async () => {
    globalThis.fetch = async () => ({
      ok: true,
      async json() {
        return { choices: [{ message: { content: JSON.stringify({ summary: "ok", chain: ["x"], confidence: "certain" }) } }] };
      },
    });
    try {
      const res = mockResponse();
      await handler({ method: "POST", body: validInput }, res);
      assert.equal(res.statusCode, 502);
      assert.equal(res.body.status, "invalid_provider_response");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test("IA server-side aceita resposta completa válida do provider", async () => {
  const originalFetch = globalThis.fetch;
  await withEnv({ AI_PROVIDER_URL: "https://provider.test", AI_PROVIDER_KEY: "test-key" }, async () => {
    globalThis.fetch = async () => ({
      ok: true,
      async json() {
        return { choices: [{ message: { content: JSON.stringify({ summary: "Afrobeat romântico", chain: ["vocal enhancement", "warm EQ", "medium compression"], confidence: "medium" }) } }] };
      },
    });
    try {
      const res = mockResponse();
      await handler({ method: "POST", body: validInput }, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.advice.confidence, "medium");
      assert.equal(res.body.advice.chain.length, 3);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test("cliente IA envia apenas metadados e devolve recomendação pronta", async () => {
  let request;
  const result = await requestProductionAdvice(validInput, async (url, options) => {
    request = { url, options };
    return { ok: true, async json() { return { status: "ready", advice: { summary: "Rever ganho", chain: ["ganho"], confidence: "low" } }; } };
  });
  assert.equal(request.url, "/api/v1/production/advice");
  assert.equal(JSON.parse(request.options.body).takeId, "take-1");
  assert.equal(result.status, "ready");
});
