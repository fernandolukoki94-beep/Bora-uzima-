import assert from "node:assert/strict";
import test from "node:test";
import { adviceToProducerPlan, validateAiAdvice } from "../src/js/ai-advice-to-plan.js";

test("valida uma recomendação IA completa", () => {
  const advice = { summary: "Afrobeat romântico", chain: ["vocal enhancement", "warm EQ", "medium compression"], confidence: "medium" };
  assert.equal(validateAiAdvice(advice), null);
});

test("transforma recomendação validada num Producer Plan local", () => {
  const plan = adviceToProducerPlan({
    advice: { summary: "Afrobeat romântico", chain: ["vocal enhancement", "warm EQ"], confidence: "medium" },
    base: { genre: "Afrobeat", tempo: 102, key: "A minor", duration: 30 },
  });
  assert.equal(plan.genre, "Afrobeat");
  assert.equal(plan.bpm, 102);
  assert.equal(plan.key, "A minor");
  assert.match(plan.brief, /Afrobeat romântico/);
  assert.equal(plan.execution.localOnly, true);
  assert.equal(plan.execution.originalPreserved, true);
});

test("rejeita confidence fora do contrato", () => {
  assert.throws(() => adviceToProducerPlan({ advice: { summary: "x", chain: ["y"], confidence: "certain" } }), /confidence inválida/);
});
