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

test("renderer de drum genérico usa uma síntese audível segura", () => {
  const buffer = renderInstrumentClip({ type: "drum", duration: 1, event: { instrument: "drum", events: [{ instrument: "drum", time: 0, velocity: 1 }] } }, { sampleRate: 8000 });
  assert.equal(buffer.length, 8000);
  assert.ok(peak(buffer) > 0);
});

test("renderer de Beat respeita canais personalizados do grid", () => {
  const buffer = renderInstrumentClip({
    type: "drums",
    duration: 2,
    event: {
      instrument: "drums",
      bpm: 104,
      bars: 1,
      channels: { kick: [0], snare: [], clap: [], hihat: [], percussion: [], bass: [] },
    },
  }, { sampleRate: 8000 });
  assert.equal(buffer.length, 16000);
  assert.ok(peak(buffer) > 0);
});

test("Mixdown mantém audível um Beat Maker personalizado", () => {
  let project = createProject({ id: "custom-beat-project", tempo: 104 });
  project = addTrack(project, { id: "custom-beat", type: "drums", name: "Drum" });
  project = addClip(project, "custom-beat", {
    id: "custom-beat-clip",
    type: "drums",
    duration: 2,
    event: { instrument: "drums", bpm: 104, bars: 1, channels: { kick: [0], snare: [], clap: [], hihat: [], percussion: [], bass: [] } },
  });
  const mixed = mixTimelineBuffers(project, new Map(), { sampleRate: 8000 });
  assert.equal(mixed.clipCount, 1);
  assert.ok(peak(mixed.left) > 0);
});

test("renderer de Bass produz corpo e harmónicos audíveis", () => {
  const buffer = renderInstrumentClip({ type: "drums", duration: 1, event: { instrument: "drums", events: [{ instrument: "bass", time: 0, velocity: 1 }] } }, { sampleRate: 8000 });
  assert.ok(peak(buffer) > 0.05);
  assert.deepEqual(Array.from(buffer), Array.from(renderInstrumentClip({ type: "drums", duration: 1, event: { instrument: "drums", events: [{ instrument: "bass", time: 0, velocity: 1 }] } }, { sampleRate: 8000 })));
});

test("renderer distingue os canais de percussão sem silêncio", () => {
  for (const instrument of ["snare", "clap", "hihat", "percussion"]) {
    const buffer = renderInstrumentClip({ type: "drums", duration: 1, event: { instrument: "drums", events: [{ instrument, time: 0, velocity: 1 }] } }, { sampleRate: 8000 });
    assert.ok(peak(buffer) > 0, `${instrument} não pode ser silencioso`);
  }
});

test("novos timbres locais de cordas e synth pad produzem clips audíveis", () => {
  for (const instrument of ["strings", "synth"]) {
    const clip = { type: "instrument", duration: 1.4, event: { instrument, chord: "C", velocity: 0.8 } };
    const first = renderInstrumentClip(clip, { sampleRate: 8000 });
    const second = renderInstrumentClip(clip, { sampleRate: 8000 });
    assert.ok(peak(first) > 0, `${instrument} não pode ser silencioso`);
    assert.deepEqual(Array.from(first), Array.from(second));
  }
});

test("renderer de Piano Roll sintetiza eventos melódicos temporizados", () => {
  const clip = {
    type: "instrument",
    duration: 0.8,
    event: {
      instrument: "piano",
      sequence: "piano-roll",
      events: [
        { note: "C4", time: 0, duration: 0.18, velocity: 0.82 },
        { note: "E4", time: 0.3, duration: 0.18, velocity: 0.72 },
      ],
    },
  };
  const first = renderInstrumentClip(clip, { sampleRate: 8000 });
  const second = renderInstrumentClip(clip, { sampleRate: 8000 });
  assert.equal(first.length, 6400);
  assert.ok(peak(first) > 0);
  assert.deepEqual(Array.from(first), Array.from(second));
});
