import test from "node:test";
import assert from "node:assert/strict";
import { harmonyParameters, normalizeHarmonyIntensity } from "../src/js/effects.js";

test("Harmony normaliza intensidade para 0..1", () => {
  assert.equal(normalizeHarmonyIntensity(-1), 0);
  assert.equal(normalizeHarmonyIntensity(0.4), 0.4);
  assert.equal(normalizeHarmonyIntensity(4), 1);
  assert.equal(normalizeHarmonyIntensity("bad"), 0);
});

test("Harmony cria duas vozes transpostas e preserva reversibilidade", () => {
  const parameters = harmonyParameters(0.5);
  assert.equal(parameters.voices, 2);
  assert.deepEqual(parameters.intervals, [4, 7]);
  assert.equal(parameters.wetGain, 0.21);
  assert.equal(parameters.reversible, true);
});

test("Harmony mantém intensidade segura nos extremos", () => {
  assert.equal(harmonyParameters(0).wetGain, 0);
  assert.equal(harmonyParameters(1).wetGain, 0.42);
});
