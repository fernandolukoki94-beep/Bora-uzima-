import test from "node:test";
import assert from "node:assert/strict";
import { addClip, createProject } from "../src/js/studio/project-model.js";
import { deleteClip, duplicateClip, moveClip, setClipFade, setClipGain, splitClip, trimClip } from "../src/js/studio/timeline.js";

function fixture() {
  const project = createProject({ name: "Timeline demo" });
  const trackId = project.tracks[0].id;
  const withClip = addClip(project, trackId, { id: "vocal-1", start: 2, duration: 10, sourceOffset: 0 });
  return { project: withClip, trackId };
}

test("move, ganho e fade respeitam os limites", () => {
  const { project, trackId } = fixture();
  const moved = moveClip(project, trackId, "vocal-1", -4);
  const gained = setClipGain(moved, trackId, "vocal-1", 4);
  const faded = setClipFade(gained, trackId, "vocal-1", 20, -1);
  assert.equal(faded.tracks[0].clips[0].start, 0);
  assert.equal(faded.tracks[0].clips[0].gain, 2);
  assert.equal(faded.tracks[0].clips[0].fadeIn, 10);
  assert.equal(faded.tracks[0].clips[0].fadeOut, 0);
  assert.equal(project.tracks[0].clips[0].start, 2);
});

test("divide um clip em duas partes com offsets correctos", () => {
  const { project, trackId } = fixture();
  const split = splitClip(project, trackId, "vocal-1", 7);
  assert.deepEqual(split.tracks[0].clips.map(({ start, duration, sourceOffset }) => ({ start, duration, sourceOffset })), [
    { start: 2, duration: 5, sourceOffset: 0 },
    { start: 7, duration: 5, sourceOffset: 5 },
  ]);
});

test("duplica, corta e apaga clips sem afectar o original", () => {
  const { project, trackId } = fixture();
  const duplicated = duplicateClip(project, trackId, "vocal-1", 1);
  assert.equal(duplicated.tracks[0].clips.length, 2);
  const trimmed = trimClip(duplicated, trackId, "vocal-1", 2, 4);
  assert.deepEqual(trimmed.tracks[0].clips[0], { ...trimmed.tracks[0].clips[0], start: 4, duration: 4, sourceOffset: 2 });
  const deleted = deleteClip(trimmed, trackId, "vocal-1");
  assert.equal(deleted.tracks[0].clips.length, 1);
  assert.equal(project.tracks[0].clips.length, 1);
});
