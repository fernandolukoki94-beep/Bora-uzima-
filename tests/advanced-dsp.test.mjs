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
