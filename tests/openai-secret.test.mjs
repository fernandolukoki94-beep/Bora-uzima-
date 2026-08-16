import test from "node:test";
import assert from "node:assert/strict";

test("OPENAI_API_KEY autentica no endpoint leve de modelos sem expor a chave", async () => {
  const key = process.env.OPENAI_API_KEY;
  assert.ok(key, "OPENAI_API_KEY não configurada");

  const response = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(10_000),
  });

  assert.notEqual(response.status, 401, "OPENAI_API_KEY rejeitada pelo provider");
  assert.notEqual(response.status, 403, "OPENAI_API_KEY sem autorização suficiente");
  const payload = await response.json();
  assert.ok(Array.isArray(payload?.data), "provider não devolveu a lista de modelos");
});
