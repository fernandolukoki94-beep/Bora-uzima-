import test from "node:test";
import assert from "node:assert/strict";
import { loadEffectPresets, saveEffectPreset, deleteEffectPreset } from "../src/js/effect-presets.js";

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
