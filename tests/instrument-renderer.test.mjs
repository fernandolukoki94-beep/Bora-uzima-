import assert from "node:assert/strict";
import test from "node:test";
import { addClip, addTrack, createProject } from "../src/js/studio/project-model.js";
import { mixTimelineBuffers } from "../src/js/studio/mixdown.js";
import { renderInstrumentClip } from "../src/js/studio/instrument-renderer.js";

function peak(buffer) {
  return Math.max(0, ...Array.from(buffer, (value) => Math.abs(value)));
}

test("renderer de Piano converte acorde C em áudio determinístico", () => {
  const clip = { type: "instrument", duration: 1, event: { instrument: "piano", kind: "chord", chord: "C" } };
  const first = renderInstrumentClip(clip, { sampleRate: 8000 });
  const second = renderInstrumentClip(clip, { sampleRate: 8000 });
  assert.equal(first.length, 8000);
  assert.ok(peak(first) > 0);
  assert.deepEqual(Array.from(first), Array.from(second));
});

test("renderer de Guitarra produz harmónicos e respeita a duração do clip", () => {
  const buffer = renderInstrumentClip({ type: "guitar", duration: 0.5, event: { instrument: "guitar", kind: "chord", chord: "Am" } }, { sampleRate: 8000 });
  assert.equal(buffer.length, 4000);
  assert.ok(peak(buffer) > 0.01);
});

test("renderer de Beat converte preset em eventos audíveis", () => {
  const buffer = renderInstrumentClip({ type: "drums", duration: 2, event: { instrument: "drums", preset: "Afrobeat", bpm: 104 } }, { sampleRate: 8000 });
  assert.equal(buffer.length, 16000);
  assert.ok(peak(buffer) > 0);
});

test("Mixdown inclui clips instrumentais sem buffer externo", () => {
  let project = createProject({ id: "renderer-project", tempo: 100 });
  const vocal = project.tracks[0].id;
  project = addTrack(project, { id: "piano", type: "piano", name: "Piano" });
  project = addClip(project, "piano", { id: "piano-c", type: "instrument", duration: 1, event: { instrument: "piano", kind: "chord", chord: "C" } });
  const mixed = mixTimelineBuffers(project, new Map(), { sampleRate: 8000 });
  assert.equal(mixed.clipCount, 1);
  assert.ok(peak(mixed.left) > 0);
  assert.equal(project.tracks.find((track) => track.id === vocal).clips.length, 0);
});
