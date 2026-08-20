import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/js/production.js", import.meta.url), "utf8");
const appSource = fs.readFileSync(new URL("../src/js/app.js", import.meta.url), "utf8");

test("produção local expõe estados explícitos e recuperação", () => {
  assert.match(source, /PREPARING/);
  assert.match(source, /ARRANGING/);
  assert.match(source, /MIXING/);
  assert.match(source, /COMPLETED/);
  assert.match(source, /CANCELLED/);
  assert.match(source, /FAILED/);
  assert.match(source, /cancelProduction/);
  assert.match(source, /failProduction/);
});

test("o módulo de produção não expõe pipeline simulada", () => {
  assert.doesNotMatch(source, /simulateProductionPipeline/);
  assert.doesNotMatch(source, /setTimeout/);
});

test("app liga cancelamento e reexecução ao Producer Plan", () => {
  assert.match(appSource, /data-cancel-process-id/);
  assert.match(appSource, /cancelProducerPlan/);
  assert.match(appSource, /Tentar Producer Plan novamente/);
  assert.match(appSource, /original foi preservado/);
});

test("pipeline mantém origem local e Mixdown no mesmo fluxo", () => {
  assert.match(appSource, /applyProducerMix/);
  assert.match(appSource, /producerPlanClipSpecs/);
  assert.match(appSource, /commitTimelineProject\(next\)/);
  assert.match(appSource, /mixdownActiveTimeline/);
});
