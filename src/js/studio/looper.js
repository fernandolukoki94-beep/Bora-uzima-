const MAX_LAYERS = 32;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createLooperState(input = {}) {
  const duration = clamp(Number(input.duration) || 4, 0.25, 120);
  const layers = Array.isArray(input.layers) ? input.layers.slice(0, MAX_LAYERS).map(normalizeLayer) : [];
  return {
    enabled: Boolean(input.enabled),
    duration,
    overdub: input.overdub !== false,
    quantize: input.quantize || "1/16",
    layers,
  };
}

export function normalizeLayer(layer = {}, index = 0) {
  return {
    id: String(layer.id || `loop-layer-${index + 1}`),
    name: String(layer.name || `Layer ${index + 1}`),
    source: String(layer.source || "local-input"),
    gain: clamp(Number(layer.gain) || 1, 0, 2),
    muted: Boolean(layer.muted),
    events: Array.isArray(layer.events) ? layer.events.map((event) => ({
      type: String(event.type || "audio"),
      time: Math.max(0, Number(event.time) || 0),
      duration: clamp(Number(event.duration) || 0.25, 0.01, 120),
      value: Number.isFinite(Number(event.value)) ? Number(event.value) : 1,
    })) : [],
  };
}

export function addLooperLayer(state, layer = {}) {
  const current = createLooperState(state);
  if (current.layers.length >= MAX_LAYERS) return current;
  const next = normalizeLayer({ ...layer, id: layer.id || `loop-layer-${current.layers.length + 1}` }, current.layers.length);
  return { ...current, enabled: true, layers: [...current.layers, next] };
}

export function removeLastLooperLayer(state) {
  const current = createLooperState(state);
  return { ...current, layers: current.layers.slice(0, -1), enabled: current.layers.length > 1 };
}

export function updateLooperLayer(state, layerId, patch = {}) {
  const current = createLooperState(state);
  return {
    ...current,
    layers: current.layers.map((layer) => layer.id === layerId ? normalizeLayer({ ...layer, ...patch }) : layer),
  };
}

export function toggleLooperLayerMute(state, layerId) {
  const current = createLooperState(state);
  return { ...current, layers: current.layers.map((layer) => layer.id === layerId ? { ...layer, muted: !layer.muted } : layer) };
}

export function flattenLooperEvents(state) {
  const current = createLooperState(state);
  return current.layers.filter((layer) => !layer.muted).flatMap((layer) => layer.events.map((event) => ({ ...event, layerId: layer.id, gain: layer.gain })));
}

export function looperSummary(state) {
  const current = createLooperState(state);
  return { layers: current.layers.length, activeLayers: current.layers.filter((layer) => !layer.muted).length, duration: current.duration, overdub: current.overdub, quantize: current.quantize };
}

export function materializeLooperClip(state, { id = `looper-${Date.now()}`, name = "Looper take" } = {}) {
  const current = createLooperState(state);
  return {
    id: String(id),
    type: "audio",
    name: String(name),
    duration: current.duration,
    source: "looper",
    event: { kind: "looper", layers: current.layers.filter((layer) => !layer.muted).map((layer) => ({ ...layer, events: layer.events.map((event) => ({ ...event })) })) },
  };
}

export { MAX_LAYERS };
