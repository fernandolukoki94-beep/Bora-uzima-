import assert from "node:assert/strict";
import test from "node:test";

import { planSequenceEvents } from "../src/js/studio/audio-engine.js";
import { createGridEvents } from "../src/js/studio/sequencer.js";
import { addClip, createProject } from "../src/js/studio/project-model.js";
import { splitClip } from "../src/js/studio/timeline.js";


test("planeia eventos de áudio com tempos absolutos sem mutar a sequência", () => {
  const sequence = {
    events: [
      { id: "a", instrument: "kick", time: 0, velocity: 0.8 },
      { id: "b", instrument: "snare", time: 0.375, velocity: 0.6 },
    ],
  };

  const planned = planSequenceEvents(sequence, 4.25);

  assert.deepEqual(planned.map((event) => event.scheduledTime), [4.25, 4.625]);
  assert.equal(sequence.events[0].scheduledTime, undefined);
});

test("normaliza tempos negativos no planeamento de eventos", () => {
  const planned = planSequenceEvents({ events: [{ time: -2, instrument: "kick" }] }, -1);
  assert.equal(planned[0].scheduledTime, 0);
});

test("grid do Beat Maker produz eventos ordenados e deduplicados", () => {
  const sequence = createGridEvents({
    bpm: 120,
    bars: 1,
    channels: { kick: [8, 0, 0], snare: [4] },
  });

  assert.deepEqual(sequence.events.map((event) => [event.instrument, event.step]), [
    ["kick", 0],
    ["snare", 4],
    ["kick", 8],
  ]);
  assert.equal(sequence.duration, 2);
});

test("clip instrumental preserva metadados de evento no projecto", () => {
  const project = createProject({ name: "Evento V1.1" });
  const trackId = project.tracks[0].id;
  const withClip = addClip(project, trackId, {
    id: "clip-piano-1",
    type: "instrument",
    instrument: "piano",
    start: 0,
    duration: 2,
    sourceOffset: 0,
    event: { kind: "note", note: "C4", velocity: 0.8 },
  });

  const clip = withClip.tracks[0].clips.find((item) => item.id === "clip-piano-1");
  assert.deepEqual(clip.event, { kind: "note", note: "C4", velocity: 0.8 });
  assert.equal(clip.instrument, "piano");
});

test("split de clip instrumental preserva o evento e divide a duração", () => {
  const baseProject = createProject();
  const project = addClip(baseProject, baseProject.tracks[0].id, {
    id: "clip-guitar-1",
    type: "instrument",
    instrument: "guitar",
    start: 0,
    duration: 4,
    sourceOffset: 0,
    event: { kind: "chord", chord: "Am" },
  });

  const split = splitClip(project, project.tracks[0].id, "clip-guitar-1", 1.5);
  const clips = split.tracks[0].clips;
  assert.deepEqual(clips.map((clip) => clip.duration), [1.5, 2.5]);
  assert.deepEqual(clips.map((clip) => clip.event), [
    { kind: "chord", chord: "Am" },
    { kind: "chord", chord: "Am" },
  ]);
});
