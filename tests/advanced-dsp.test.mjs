import test from "node:test";
import assert from "node:assert/strict";
import { compressSamples, noiseGateSamples, normalizeSamples } from "../src/js/effects.js";

test("normaliza samples sem ultrapassar o pico alvo", () => {
  const result = normalizeSamples(Float32Array.from([0.2, -0.4, 0.8]), 0.95);
  assert.ok(Math.abs(Math.max(...result.map(Math.abs)) - 0.95) < 0.00001);
  assert.equal(result[0] > 0, true);
});

test("compressor reduz apenas a região acima do threshold", () => {
  const result = compressSamples(Float32Array.from([0.2, 0.6, 1]), { threshold: 0.6, ratio: 4 });
  assert.ok(Math.abs(result[0] - 0.2) < 0.00001);
  assert.ok(Math.abs(result[1] - 0.6) < 0.00001);
  assert.ok(Math.abs(result[2] - 0.7) < 0.00001);
});

test("noise gate remove ruído abaixo do limiar e preserva sinal útil", () => {
  const result = noiseGateSamples(Float32Array.from([0.001, -0.02, 0.03, -0.5]), { threshold: 0.025 });
  assert.equal(result[0], 0);
  assert.equal(result[1], 0);
  assert.ok(Math.abs(result[2] - 0.03) < 0.00001);
  assert.equal(result[3], -0.5);
});


test("pitch correction assistida limita cents ao intervalo seguro", async () => {
  const { normalizePitchCorrectionCents } = await import("../src/js/effects.js");
  assert.equal(normalizePitchCorrectionCents(-500), -100);
  assert.equal(normalizePitchCorrectionCents(500), 100);
  assert.equal(normalizePitchCorrectionCents("invalido"), 0);
});

test("Auto-Tune local normaliza intensidade e expõe correcção mensurável", async () => {
  const { autoTuneParameters, normalizeAutoTuneIntensity } = await import("../src/js/effects.js");
  assert.equal(normalizeAutoTuneIntensity(-1), 0);
  assert.equal(normalizeAutoTuneIntensity(2), 1);
  assert.equal(normalizeAutoTuneIntensity("invalido"), 0);
  assert.deepEqual(autoTuneParameters(0), { intensity: 0, correctionCents: 0, latencySafe: true });
  assert.deepEqual(autoTuneParameters(0.5), { intensity: 0.5, correctionCents: 25, latencySafe: true });
  assert.deepEqual(autoTuneParameters(1), { intensity: 1, correctionCents: 50, latencySafe: true });
});
