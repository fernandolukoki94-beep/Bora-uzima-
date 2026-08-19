import test from "node:test";
import assert from "node:assert/strict";
import { addLooperLayer, createLooperState, flattenLooperEvents, removeLastLooperLayer, toggleLooperLayerMute, updateLooperLayer } from "../src/js/studio/looper.js";

test("Looper cria estado seguro e adiciona camadas independentes", () => {
  const initial = createLooperState({ duration: 8, quantize: "1/16" });
  const next = addLooperLayer(initial, { name: "Vocal loop", events: [{ type: "audio", time: 0, duration: 2 }] });
  assert.equal(next.enabled, true);
  assert.equal(next.layers.length, 1);
  assert.equal(next.layers[0].name, "Vocal loop");
  assert.equal(next.layers[0].events.length, 1);
  assert.notEqual(next, initial);
});

test("Looper suporta overdub e flatten apenas de camadas activas", () => {
  let state = createLooperState({ duration: 4, overdub: true });
  state = addLooperLayer(state, { events: [{ type: "note", time: 0, value: 0.8 }] });
  state = addLooperLayer(state, { events: [{ type: "note", time: 1, value: 0.5 }] });
  state = toggleLooperLayerMute(state, "loop-layer-1");
  assert.equal(state.overdub, true);
  assert.equal(flattenLooperEvents(state).length, 1);
  assert.equal(flattenLooperEvents(state)[0].layerId, "loop-layer-2");
});

test("Looper actualiza ganho e faz undo apenas da última camada", () => {
  let state = addLooperLayer(createLooperState(), { name: "A" });
  state = addLooperLayer(state, { name: "B", gain: 0.4 });
  state = updateLooperLayer(state, "loop-layer-2", { gain: 1.5 });
  assert.equal(state.layers[1].gain, 1.5);
  const undone = removeLastLooperLayer(state);
  assert.equal(undone.layers.length, 1);
  assert.equal(undone.layers[0].name, "A");
});
