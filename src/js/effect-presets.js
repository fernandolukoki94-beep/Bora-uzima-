const PRESET_STORAGE_KEY = "fernando-lucoco-effect-presets-v1";

const clampPercent = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const BUILT_IN_PRESETS = [
  { id: "builtin-dry", name: "Voz seca", autoTune: { intensity: 35, root: "C", scale: "chromatic", bypass: false }, eq: { intensity: 0, bypass: true }, compressor: { intensity: 0, bypass: true }, reverb: { intensity: 0, bypass: true }, delay: { intensity: 0, bypass: true }, saturation: { intensity: 0, bypass: true } },
  { id: "builtin-room", name: "Sala", autoTune: { intensity: 45, root: "C", scale: "major", bypass: false }, eq: { intensity: 32, bypass: false }, compressor: { intensity: 34, bypass: false }, reverb: { intensity: 28, bypass: false }, delay: { intensity: 8, bypass: false }, saturation: { intensity: 6, bypass: false } },
  { id: "builtin-plate", name: "Plate", autoTune: { intensity: 50, root: "C", scale: "major", bypass: false }, eq: { intensity: 40, bypass: false }, compressor: { intensity: 42, bypass: false }, reverb: { intensity: 42, bypass: false }, delay: { intensity: 12, bypass: false }, saturation: { intensity: 10, bypass: false } },
  { id: "builtin-echo", name: "Eco", autoTune: { intensity: 40, root: "A", scale: "minor", bypass: false }, eq: { intensity: 24, bypass: false }, compressor: { intensity: 28, bypass: false }, reverb: { intensity: 18, bypass: false }, delay: { intensity: 38, bypass: false }, saturation: { intensity: 8, bypass: false } },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

export function normalizeEffectPreset(input = {}) {
  return {
    id: String(input.id || `preset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    name: String(input.name || "Predefinição sem nome").trim().slice(0, 60) || "Predefinição sem nome",
    createdAt: input.createdAt || new Date().toISOString(),
    builtIn: Boolean(input.builtIn),
    autoTune: {
      enabled: input.autoTune?.enabled !== false,
      intensity: clampPercent(input.autoTune?.intensity),
      root: String(input.autoTune?.root || "C"),
      scale: String(input.autoTune?.scale || "chromatic"),
      bypass: Boolean(input.autoTune?.bypass),
    },
    eq: { intensity: clampPercent(input.eq?.intensity), bypass: Boolean(input.eq?.bypass) },
    compressor: { intensity: clampPercent(input.compressor?.intensity), bypass: Boolean(input.compressor?.bypass) },
    reverb: { intensity: clampPercent(input.reverb?.intensity), bypass: Boolean(input.reverb?.bypass) },
    delay: { intensity: clampPercent(input.delay?.intensity), bypass: Boolean(input.delay?.bypass) },
    saturation: { intensity: clampPercent(input.saturation?.intensity), bypass: Boolean(input.saturation?.bypass) },
  };
}

export function loadBuiltInEffectPresets() {
  return BUILT_IN_PRESETS.map((preset) => normalizeEffectPreset({ ...preset, builtIn: true }));
}

export function loadEffectPresets(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(PRESET_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const custom = Array.isArray(parsed) ? parsed.map(normalizeEffectPreset).filter((item) => !item.builtIn) : [];
    return [...loadBuiltInEffectPresets(), ...custom];
  } catch {
    return loadBuiltInEffectPresets();
  }
}

export function saveEffectPreset(preset, storage = globalThis.localStorage) {
  const normalized = normalizeEffectPreset({ ...preset, builtIn: false });
  const custom = loadEffectPresets(storage).filter((item) => !item.builtIn && item.id !== normalized.id);
  storage?.setItem(PRESET_STORAGE_KEY, JSON.stringify([normalized, ...custom].slice(0, 30)));
  return normalized;
}

export function deleteEffectPreset(id, storage = globalThis.localStorage) {
  const custom = loadEffectPresets(storage).filter((item) => !item.builtIn && item.id !== id);
  storage?.setItem(PRESET_STORAGE_KEY, JSON.stringify(custom));
  return [...loadBuiltInEffectPresets(), ...custom];
}

export function isBuiltInEffectPreset(id) {
  return String(id || "").startsWith("builtin-");
}

export const EFFECT_PRESET_STORAGE_KEY = PRESET_STORAGE_KEY;
export const BUILT_IN_EFFECT_PRESETS = clone(BUILT_IN_PRESETS);
