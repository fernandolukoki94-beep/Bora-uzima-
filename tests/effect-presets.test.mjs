import test from "node:test";
import assert from "node:assert/strict";
import { loadEffectPresets, saveEffectPreset, deleteEffectPreset } from "../src/js/effect-presets.js";
import { MODULAR_FX_TYPES, normalizeFxIntensity } from "../src/js/effects.js";

const createStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
};

test("normaliza e persiste uma configuração completa de efeitos", () => {
  const storage = createStorage();
  const preset = saveEffectPreset({
    name: "Voz quente",
    autoTune: { intensity: "72", root: "A", scale: "minor", bypass: false },
    reverb: { intensity: "34", bypass: true },
    delay: { intensity: "18", bypass: false },
  }, storage);
  assert.equal(preset.name, "Voz quente");
  const presets = loadEffectPresets(storage);
  assert.equal(presets.length, 5);
  assert.equal(presets.find((item) => item.id === preset.id).reverb.bypass, true);
});

test("permite apagar apenas a predefinição escolhida", () => {
  const storage = createStorage();
  const first = saveEffectPreset({ name: "Primeira" }, storage);
  const second = saveEffectPreset({ name: "Segunda" }, storage);
  deleteEffectPreset(first.id, storage);
  assert.deepEqual(loadEffectPresets(storage).filter((item) => !item.builtIn).map((item) => item.name), [second.name]);
});

test("normaliza a intensidade dos efeitos modulares e expõe catálogo profissional", () => {
  assert.equal(normalizeFxIntensity(-1), 0);
  assert.equal(normalizeFxIntensity(0.45), 0.45);
  assert.equal(normalizeFxIntensity(3), 1);
  assert.deepEqual(MODULAR_FX_TYPES, ["compressor", "limiter", "eq", "chorus", "flanger", "saturation", "de-esser", "gate"]);
});
