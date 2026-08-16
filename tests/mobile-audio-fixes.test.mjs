import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/js/app.js", import.meta.url), "utf8");
const audio = fs.readFileSync(new URL("../src/js/studio/audio-engine.js", import.meta.url), "utf8");
const effects = fs.readFileSync(new URL("../src/js/effects.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/css/styles.css", import.meta.url), "utf8");

test("Mixer expõe ganho contínuo em dB e preserva conversão para schema linear", () => {
  assert.match(app, /min=\"-60\" max=\"6\" step=\"0\.5\"/);
  assert.match(app, /dbToLinear\(rawValue\)/);
  assert.match(app, /formatGainDb\(value\)/);
});

test("instrumentos usam envelope e filtro para resposta menos agressiva", () => {
  assert.match(audio, /createBiquadFilter\(\)/);
  assert.match(audio, /exponentialRampToValueAtTime/);
  assert.match(audio, /instrument === \"kick\"/);
});

test("percussão mantém ruído determinístico sem Math.random", () => {
  assert.match(audio, /const seed = Math\.sin/);
  assert.doesNotMatch(audio, /Math\.random\(\)/);
});

test("melhoria vocal local usa passa-alto, presença e compressor", () => {
  assert.match(effects, /export function applyVocalEnhancement/);
  assert.match(effects, /highPass\.type = \"highpass\"/);
  assert.match(effects, /presence\.type = \"peaking\"/);
  assert.match(effects, /createDynamicsCompressor\(\)/);
});

test("controlos instrumentais têm feedback e alvos móveis", () => {
  assert.match(app, /function flashControl/);
  assert.match(css, /\.key\.is-playing/);
  assert.match(css, /\.beat-step \{/);
});
