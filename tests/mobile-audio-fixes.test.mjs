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

test("ganho solicitado passa por limiter em vez de ser silenciosamente reduzido", () => {
  assert.match(effects, /gainNode\.gain\.value = Math\.max\(0\.05, Math\.min\(4, Number\(gain\)/);
  assert.match(effects, /limiter\.ratio\.value = 20/);
  assert.match(effects, /source\.connect\(gainNode\)\.connect\(limiter\)/);
});

test("kick e bass têm níveis dedicados acima da percussão genérica", () => {
  assert.match(audio, /safeInstrument === "kick" \? 0\.56/);
  assert.match(audio, /safeInstrument === "bass" \? 0\.3/);
});

test("kick usa síntese dedicada com ataque e queda de frequência no preview e no Mixdown", () => {
  const renderer = fs.readFileSync(new URL("../src/js/studio/instrument-renderer.js", import.meta.url), "utf8");
  assert.match(audio, /isKick \? 155 : 65/);
  assert.match(audio, /isKick \? 48 : 48/);
  assert.match(renderer, /function addKick/);
  assert.match(renderer, /Math\.pow\(48 \/ 155/);
  assert.match(renderer, /const attack/);
});
