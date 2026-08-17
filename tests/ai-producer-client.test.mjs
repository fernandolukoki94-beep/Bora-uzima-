
import test from "node:test";
import assert from "node:assert/strict";
import { requestProductionAdvice } from "../src/js/ai-producer-client.js";

test("cliente distingue quota esgotada sem expor credenciais nem alterar áudio", async () => {
  await assert.rejects(
    requestProductionAdvice({ intent: "Afrobeat", takeId: "take-1" }, async () => new Response(JSON.stringify({ status: "provider_quota_exhausted" }), { status: 503, headers: { "Content-Type": "application/json" } })),
    (error) => error.status === "provider_quota_exhausted" && /quota está esgotada/.test(error.message),
  );
});

test("cliente distingue provider indisponível e mantém fallback local possível", async () => {
  await assert.rejects(
    requestProductionAdvice({ intent: "Balada", takeId: "take-2" }, async () => new Response(JSON.stringify({ status: "provider_unavailable" }), { status: 503, headers: { "Content-Type": "application/json" } })),
    (error) => error.status === "provider_unavailable" && /Producer Plan local/.test(error.message),
  );
});
