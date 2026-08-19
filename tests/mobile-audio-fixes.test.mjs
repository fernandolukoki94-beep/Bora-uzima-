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

test("Producer Studio expõe Auto-Tune local e waveforms para vocal e beat", () => {
  assert.match(app, /applyAutoTuneLocal/);
  assert.match(app, /producerVocalWaveform/);
  assert.match(app, /producerBeatWaveform/);
  assert.match(css, /waveform-grid/);
});

test("ganho solicitado passa por limiter em vez de ser silenciosamente reduzido", () => {
  assert.match(effects, /gainNode\.gain\.value = Math\.max\(0\.05, Math\.min\(4, Number\(gain\)/);
  assert.match(effects, /limiter\.ratio\.value = 20/);
  assert.match(effects, /source\.connect\(gainNode\)\.connect\(limiter\)/);
});

test("kick e bass têm níveis dedicados acima da percussão genérica", () => {
  assert.match(audio, /safeInstrument === "kick" \? 0\.72/);
  assert.match(audio, /safeInstrument === "bass" \? 0\.42/);
});

test("kick usa síntese dedicada com ataque e queda de frequência no preview e no Mixdown", () => {
  const renderer = fs.readFileSync(new URL("../src/js/studio/instrument-renderer.js", import.meta.url), "utf8");
  assert.match(audio, /isKick \? 185 : 58/);
  assert.match(audio, /isKick \? 44 : 48/);
  assert.match(audio, /isBass/);
  assert.match(audio, /harmonic\.frequency/);
  assert.match(renderer, /function addKick/);
  assert.match(renderer, /Math\.pow\(44 \/ 185/);
  assert.match(renderer, /const attack/);
});

test("Producer Studio expõe escala, análise de pitch e exportação final Vocal + beat", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /id="producer-autotune-root"/);
  assert.match(html, /id="producer-autotune-scale"/);
  assert.match(html, /id="producer-analyze-pitch"/);
  assert.match(html, /id="producer-export"/);
  assert.match(html, /id="producer-vocal-waveform"/);
  assert.match(html, /id="producer-beat-waveform"/);
});

test("Producer Studio expõe editor de notas, curva interactiva e partilha final", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /producer-pitch-curve/);
  assert.match(html, /producer-pitch-notes/);
  assert.match(html, /producer-share/);
});

test("app liga edição manual de notas, curva e Web Share com fallback", () => {
  assert.match(app, /updateEditedPitch/);
  assert.match(app, /editPitchFromCurve/);
  assert.match(app, /navigator\.share/);
  assert.match(app, /exportMixedVersion\(project\.id\)/);
});

test("Producer Studio expõe bypass A/B sem substituir variantes", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /id="producer-bypass"/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(app, /producerBypassActive/);
  assert.match(app, /Bypass activo: Original/);
  assert.match(app, /playProducerPreview\(producerBypassActive \? "original" : "mixed"\)/);
});
