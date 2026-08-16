import assert from "node:assert/strict";
import test from "node:test";
import { addClip, addTrack, createProject, normalizeProject, updateTrack } from "../src/js/studio/project-model.js";
import { canRedo, canUndo, commitHistory, createHistoryState, redoHistory, undoHistory } from "../src/js/studio/history.js";
import { createGridEvents } from "../src/js/studio/sequencer.js";
import { BEAT_PRESETS, getBeatPreset } from "../src/js/studio/instruments.js";
import { deleteClip, duplicateClip, moveClip, setClipFade, setClipGain, splitClip, trimClip } from "../src/js/studio/timeline.js";
import { mixdownBuffersToWav } from "../src/js/studio/mixdown.js";

function clip(project, trackId = project.tracks[0].id, id = "clip-vocal") {
  return addClip(project, trackId, { id, blobKey: `${project.id}:original`, start: 10, duration: 10, sourceOffset: 0, gain: 1 });
}

test("Mixer V1.1 persiste quatro tracks e todos os controlos", () => {
  let project = createProject({ id: "integration-mixer" });
  const vocal = project.tracks[0].id;
  project = addTrack(project, { id: "beat", name: "Beat", type: "drums" });
  project = addTrack(project, { id: "piano", name: "Piano", type: "piano" });
  project = addTrack(project, { id: "guitar", name: "Guitar", type: "guitar" });
  project = updateTrack(project, vocal, { volume: 0.8, muted: true });
  project = updateTrack(project, "beat", { volume: 1.2, solo: true });
  project = updateTrack(project, "piano", { pan: -0.5 });
  project = updateTrack(project, "guitar", { pan: 0.5 });
  const reloaded = normalizeProject(JSON.parse(JSON.stringify(project)));
  assert.deepEqual(reloaded.tracks.map(({ id, volume, pan, muted, solo }) => ({ id, volume, pan, muted, solo })), [
    { id: vocal, volume: 0.8, pan: 0, muted: true, solo: false },
    { id: "beat", volume: 1.2, pan: 0, muted: false, solo: true },
    { id: "piano", volume: 1, pan: -0.5, muted: false, solo: false },
    { id: "guitar", volume: 1, pan: 0.5, muted: false, solo: false },
  ]);
});

test("cadeia Move, Trim, Split, Gain, Fade, Duplicate e Delete atravessa Undo/Redo", () => {
  const base = clip(createProject({ id: "integration-history" }));
  const trackId = base.tracks[0].id;
  let state = createHistoryState(base);
  const commit = (next) => { state = commitHistory(state, next); };
  let current = moveClip(base, trackId, "clip-vocal", 12); commit(current);
  current = trimClip(current, trackId, "clip-vocal", 2, 8); commit(current);
  current = splitClip(current, trackId, "clip-vocal", 16); commit(current);
  const splitIds = current.tracks[0].clips.map((item) => item.id);
  current = setClipGain(current, trackId, splitIds[0], 0.7); commit(current);
  current = setClipFade(current, trackId, splitIds[0], 0.4, 0.5); commit(current);
  current = duplicateClip(current, trackId, splitIds[0], 8); commit(current);
  const duplicateId = current.tracks[0].clips.at(-1).id;
  current = deleteClip(current, trackId, duplicateId); commit(current);
  assert.equal(state.past.length, 7);
  for (let index = 0; index < 7; index += 1) { assert.equal(canUndo(state), true); state = undoHistory(state); }
  assert.deepEqual(state.present, base);
  for (let index = 0; index < 7; index += 1) { assert.equal(canRedo(state), true); state = redoHistory(state); }
  assert.equal(state.present.tracks[0].clips.length, 2);
  assert.equal(state.present.tracks[0].clips[0].gain, 0.7);
  assert.equal(state.present.tracks[0].clips[0].fadeIn, 0.4);
});

test("todos os presets de Beat produzem eventos determinísticos adicionáveis à timeline", () => {
  for (const presetName of Object.keys(BEAT_PRESETS)) {
    const preset = getBeatPreset(presetName);
    const sequence = createGridEvents({ bpm: preset.bpm, bars: 1, channels: preset.channels });
    assert.equal(sequence.events.length > 0, true, presetName);
    assert.equal(sequence.events.every((event) => event.time >= 0), true, presetName);
    assert.equal(sequence.duration > 0, true, presetName);
  }
});

test("eventos de Piano e Guitarra conservam identidade ao entrar na timeline", () => {
  let project = createProject({ id: "integration-instruments" });
  const trackId = project.tracks[0].id;
  project = addClip(project, trackId, { id: "piano-c-major", type: "instrument", instrument: "piano", duration: 2, event: { kind: "chord", chord: "C", notes: ["C4", "E4", "G4"] } });
  project = addClip(project, trackId, { id: "guitar-am", type: "instrument", instrument: "guitar", start: 2, duration: 2, event: { kind: "chord", chord: "Am" } });
  const events = project.tracks[0].clips.map((item) => [item.instrument, item.event.kind, item.event.chord]);
  assert.deepEqual(events, [["piano", "chord", "C"], ["guitar", "chord", "Am"]]);
});

test("Mixdown efectivo demonstra que gain, mute, solo, pan e headroom alteram a saída", async () => {
  const base = createProject({ id: "integration-audio" });
  const vocal = base.tracks[0].id;
  let project = addTrack(base, { id: "beat", name: "Beat", type: "drums" });
  project = addClip(project, vocal, { id: "vocal-clip", blobKey: "vocal", duration: 1 });
  project = addClip(project, "beat", { id: "beat-clip", blobKey: "beat", duration: 1 });
  const buffers = new Map([["vocal", new Float32Array([0.25, 0.25, 0.25, 0.25])], ["beat", new Float32Array([0.5, 0.5, 0.5, 0.5])]]);
  const normal = mixdownBuffersToWav(project, buffers, { sampleRate: 4 });
  const halfVocal = mixdownBuffersToWav({ ...project, tracks: project.tracks.map((track) => track.id === vocal ? { ...track, volume: 0.5 } : track) }, buffers, { sampleRate: 4 });
  const muted = mixdownBuffersToWav({ ...project, tracks: project.tracks.map((track) => track.id === "beat" ? { ...track, muted: true } : track) }, buffers, { sampleRate: 4 });
  const solo = mixdownBuffersToWav({ ...project, tracks: project.tracks.map((track) => ({ ...track, solo: track.id === vocal })) }, buffers, { sampleRate: 4 });
  const panned = mixdownBuffersToWav({ ...project, tracks: project.tracks.map((track) => track.id === vocal ? { ...track, pan: -1 } : track) }, buffers, { sampleRate: 4 });
  const limited = mixdownBuffersToWav(project, new Map([["vocal", new Float32Array([2, 2, 2, 2])], ["beat", new Float32Array([2, 2, 2, 2])]]), { sampleRate: 4, headroom: 0.8 });
  assert.notDeepEqual(Array.from(normal.left), Array.from(halfVocal.left));
  assert.notDeepEqual(Array.from(normal.left), Array.from(muted.left));
  assert.notDeepEqual(Array.from(normal.left), Array.from(solo.left));
  assert.ok(panned.left[0] > panned.right[0]);
  assert.ok(limited.peakAfterHeadroom <= 0.800001);
  assert.equal(normal.wav.type, "audio/wav");
});

test("trim mantém start e avança apenas sourceOffset", () => {
  const base = clip(createProject({ id: "integration-trim" }));
  const trackId = base.tracks[0].id;
  const trimmed = trimClip(base, trackId, "clip-vocal", 2, 8).tracks[0].clips[0];
  assert.equal(trimmed.start, 10);
  assert.equal(trimmed.duration, 8);
  assert.equal(trimmed.sourceOffset, 2);
});

test("split preserva continuidade da fonte e o projecto completo sobrevive ao reload", () => {
  let project = createProject({ id: "integration-reload", name: "Sessão V1.1" });
  const vocal = project.tracks[0].id;
  project = addTrack(project, { id: "beat", type: "drums" });
  project = addTrack(project, { id: "piano", type: "piano" });
  project = addTrack(project, { id: "guitar", type: "guitar" });
  project = addClip(project, vocal, { id: "vocal", blobKey: "take:original", start: 10, duration: 10, sourceOffset: 0 });
  const split = splitClip(project, vocal, "vocal", 14);
  const pieces = split.tracks.find((track) => track.id === vocal).clips;
  assert.deepEqual(pieces.map((item) => [item.start, item.duration, item.sourceOffset]), [[10, 4, 0], [14, 6, 4]]);
  const reloaded = normalizeProject(JSON.parse(JSON.stringify(split)));
  assert.equal(reloaded.name, "Sessão V1.1");
  assert.deepEqual(reloaded.tracks.map((track) => track.id), [vocal, "beat", "piano", "guitar"]);
  assert.equal(reloaded.tracks.find((track) => track.id === vocal).clips.length, 2);
});
