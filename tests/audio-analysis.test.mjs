import test from "node:test";
import assert from "node:assert/strict";
import { analyzeAudioSamples, ANALYSIS_LIMITS } from "../src/js/audio-analysis.js";
import { buildProducerPlan } from "../src/js/producer-plan.js";

function sine(frequency, seconds = 2, sampleRate = 8000) {
  return Float32Array.from({ length: Math.floor(seconds * sampleRate) }, (_, index) => Math.sin(2 * Math.PI * frequency * index / sampleRate) * 0.35);
}

function pulseTrain(bpm = 120, seconds = 8, sampleRate = 8000) {
  const samples = new Float32Array(Math.floor(seconds * sampleRate));
  const interval = Math.round(60 / bpm * sampleRate);
  for (let start = 0; start < samples.length; start += interval) {
    for (let index = 0; index < Math.min(sampleRate * 0.03, samples.length - start); index += 1) {
      samples[start + index] = Math.sin(2 * Math.PI * 100 * index / sampleRate) * 0.8 * (1 - index / (sampleRate * 0.03));
    }
  }
  return samples;
}

test("análise local devolve resultado seguro para silêncio", () => {
  const result = analyzeAudioSamples(new Float32Array(8000), 8000);
  assert.equal(result.hasAudio, false);
  assert.equal(result.bpm, 100);
  assert.equal(result.confidence, 0);
});

test("análise local estima classe tonal de um tom determinístico", () => {
  const result = analyzeAudioSamples(sine(440), 8000);
  assert.equal(result.hasAudio, true);
  assert.equal(result.key, "A");
  assert.ok(result.keyConfidence > 0.2);
  assert.ok(result.vocal.rmsDb < 0);
});

test("BPM permanece dentro dos limites da análise local", () => {
  const result = analyzeAudioSamples(pulseTrain(120), 8000);
  assert.ok(result.bpm >= ANALYSIS_LIMITS.minBpm);
  assert.ok(result.bpm <= ANALYSIS_LIMITS.maxBpm);
  assert.ok(result.duration > 7);
});

test("Producer Plan usa a análise apenas quando solicitado", () => {
  const analysis = { hasAudio: true, bpm: 128, bpmConfidence: 0.8, key: "A", keyConfidence: 0.8 };
  const manual = buildProducerPlan({ tempo: 100, key: "C", analysis, preferAnalysis: false });
  const analyzed = buildProducerPlan({ tempo: 100, key: "C", analysis, preferAnalysis: true });
  assert.equal(manual.bpm, 100);
  assert.equal(manual.key, "C");
  assert.equal(analyzed.bpm, 128);
  assert.equal(analyzed.key, "A");
  assert.deepEqual(analyzed.analysis, analysis);
});
