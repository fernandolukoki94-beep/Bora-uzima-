import assert from "node:assert/strict";
import test from "node:test";

import { mixMonoToStereo, mixTracks, panGains } from "../src/js/studio/mixing-engine.js";


test("pan central distribui o sinal pelos dois canais", () => {
  const gains = panGains(0);
  assert.ok(Math.abs(gains.left - gains.right) < 0.000001);
});

test("mistura duas faixas com ganho e mantém o original intacto", () => {
  const first = new Float32Array([0.25, -0.25]);
  const second = new Float32Array([0.25, 0.25]);
  const result = mixTracks([
    { buffer: first, gain: 1, pan: -1 },
    { buffer: second, gain: 0.5, pan: 1 },
  ]);

  assert.deepEqual(Array.from(first), [0.25, -0.25]);
  assert.equal(result.trackCount, 2);
  assert.ok(result.left[0] > 0);
  assert.ok(result.right[0] > 0);
});

test("mute e solo seleccionam faixas sem mutar o estado de entrada", () => {
  const vocal = new Float32Array([0.4]);
  const beat = new Float32Array([0.8]);
  const result = mixTracks([
    { buffer: vocal, gain: 1, pan: 0, solo: true },
    { buffer: beat, gain: 1, pan: 0, muted: true },
  ]);

  assert.equal(result.trackCount, 1);
  assert.ok(Math.abs(vocal[0] - 0.4) < 0.000001);
  assert.ok(Math.abs(beat[0] - 0.8) < 0.000001);
});

test("master headroom limita o pico e reporta a escala aplicada", () => {
  const result = mixMonoToStereo(new Float32Array([2, -2]), { headroom: 0.9 });
  assert.ok(result.peakBeforeHeadroom > 0.9);
  assert.ok(result.peakAfterHeadroom <= 0.900001);
  assert.ok(result.scale < 1);
});

test("master channel aplica ganho e limiter configurável", () => {
  const result = mixMonoToStereo(new Float32Array([1, -1]), { master: { gain: 1.5, pan: 0, limiter: 0.5 } });
  assert.ok(result.peakBeforeHeadroom > 0.5);
  assert.ok(result.peakAfterHeadroom <= 0.500001);
});

test("master bypass preserva o ganho legacy e não muta o buffer", () => {
  const source = new Float32Array([0.25, -0.25]);
  const result = mixMonoToStereo(source, { master: { gain: 1.8, pan: 1, limiter: 0.2, bypass: true } });
  assert.equal(source[0], 0.25);
  assert.ok(result.peakAfterHeadroom > 0.15);
});

test("buffers vazios produzem uma mistura segura", () => {
  const result = mixTracks([]);
  assert.equal(result.left.length, 0);
  assert.equal(result.right.length, 0);
  assert.equal(result.trackCount, 0);
});
