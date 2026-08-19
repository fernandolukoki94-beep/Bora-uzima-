import test from "node:test";
import assert from "node:assert/strict";
import { createSamplerState, samplerPlaybackPlan, samplerRegion, updateSamplerState } from "../src/js/studio/sampler.js";

test("Sampler normaliza região, pitch, loop e filtro", () => {
  const state = createSamplerState({ duration: 10, start: 2, end: 8, pitch: 12, reverse: true, loop: true, filterType: "highpass", filterFrequency: 900 });
  assert.deepEqual(samplerRegion(state), { start: 2, end: 8, duration: 6 });
  assert.equal(state.pitch, 12);
  assert.equal(state.reverse, true);
  assert.equal(state.loop, true);
  assert.equal(state.filterType, "highpass");
});

test("Sampler cria plano de reprodução com transposição e envelope por velocity", () => {
  const plan = samplerPlaybackPlan(createSamplerState({ duration: 4, pitch: 0, attack: 0.2, decay: 0.4, sustain: 0.8, release: 0.5 }), { pitch: 12, velocity: 0.5 });
  assert.equal(plan.playbackRate, 2);
  assert.equal(plan.envelope.attack, 0.2);
  assert.equal(plan.envelope.sustain, 0.4);
  assert.equal(plan.filter.type, "lowpass");
});

test("Sampler actualiza parâmetros de forma não destrutiva e limita extremos", () => {
  const initial = createSamplerState({ duration: 1 });
  const next = updateSamplerState(initial, { start: -2, end: 8, pitch: 99, sustain: -1, filterFrequency: 99999 });
  assert.equal(next.start, 0);
  assert.equal(next.end, 1);
  assert.equal(next.pitch, 24);
  assert.equal(next.sustain, 0);
  assert.equal(next.filterFrequency, 20000);
  assert.equal(initial.pitch, 0);
});
