import test from "node:test";
import assert from "node:assert/strict";
import {
  addClip,
  addTrack,
  createProject,
  normalizeProject,
  serializeProject,
  updateClip,
  updateTrack,
} from "../src/js/studio/project-model.js";

test("cria um schema de projecto preparado para o Music Engine", () => {
  const project = createProject({ name: "Demo Fernando", tempo: 96, key: "Am" });
  assert.equal(project.schemaVersion, 3);
  assert.equal(project.tempo, 96);
  assert.equal(project.key, "Am");
  assert.equal(project.tracks.length, 1);
  assert.deepEqual(project.tracks[0].clips, []);
});

test("migra uma take vocal legacy para track e clip", () => {
  const migrated = normalizeProject({
    id: "legacy-1",
    name: "Take antiga",
    originalAudioData: "data:audio/webm;base64,AAAA",
    duration: 12.5,
    mimeType: "audio/webm",
  });
  assert.equal(migrated.schemaVersion, 3);
  assert.deepEqual(migrated.tracks[0].clips[0], {
    id: "legacy-1-clip-original",
    name: "Take antiga",
    blobKey: "legacy-1:original",
    start: 0,
    duration: 12.5,
    sourceOffset: 0,
    mimeType: "audio/webm",
    gain: 1,
    fadeIn: 0,
    fadeOut: 0,
  });
});

test("adiciona tracks e clips sem mutar a origem", () => {
  const source = createProject();
  const withTrack = addTrack(source, { name: "Beat", type: "drums" });
  const withClip = addClip(withTrack, withTrack.tracks[1].id, { start: 2, duration: 4 });
  assert.equal(source.tracks.length, 1);
  assert.deepEqual(withClip.tracks[1].clips[0], { ...withClip.tracks[1].clips[0], start: 2, duration: 4 });
});

test("actualiza controlos de mistura e arranjo de clips de forma imutável", () => {
  const source = createProject();
  const trackId = source.tracks[0].id;
  const project = addClip(source, trackId, { id: "clip-1" });
  const updatedTrack = updateTrack(project, trackId, { volume: 0.7, pan: -0.2, muted: true });
  const updatedClip = updateClip(updatedTrack, trackId, "clip-1", { start: 8, fadeIn: 0.4 });
  assert.deepEqual(updatedClip.tracks[0], { ...updatedClip.tracks[0], volume: 0.7, pan: -0.2, muted: true });
  assert.equal(updatedClip.tracks[0].clips[0].start, 8);
  assert.equal(updatedClip.tracks[0].clips[0].fadeIn, 0.4);
  assert.equal(project.tracks[0].muted, false);
});

test("serializa apenas dados JSON-safe", () => {
  const result = serializeProject(createProject({ name: "JSON demo" }));
  assert.equal(result.name, "JSON demo");
  assert.equal(result.schemaVersion, 3);
  assert.doesNotThrow(() => JSON.stringify(result));
});
