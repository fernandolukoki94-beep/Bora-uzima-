import assert from "node:assert/strict";
import test from "node:test";
import { addClip, createProject } from "../src/js/studio/project-model.js";
import { mixdownBuffersToWav, mixTimelineBuffers } from "../src/js/studio/mixdown.js";

function fixture() {
  const project = createProject({ id: "mix-project", name: "Mix demo" });
  const trackId = project.tracks[0].id;
  return { project: addClip(project, trackId, { id: "clip-a", blobKey: "take-a", start: 0, duration: 1, gain: 1 }), trackId };
}

test("mixdown soma clips, respeita duração e não muta o buffer", () => {
  const { project } = fixture();
  const source = new Float32Array([0.25, -0.25, 0.5, -0.5]);
  const original = source.slice();
  const result = mixTimelineBuffers(project, new Map([["take-a", source]]), { sampleRate: 4 });
  assert.equal(result.left.length, 4);
  assert.equal(result.clipCount, 1);
  assert.deepEqual(source, original);
  assert.equal(result.left[0] > 0, true);
  assert.equal(result.right[1] < 0, true);
});

test("mixdown aplica mute, solo, ganho de clip e pan", () => {
  const { project, trackId } = fixture();
  const secondTrack = { id: "track-2", name: "Beat", type: "instrument", volume: 1, pan: -1, muted: false, solo: true, clips: [{ id: "clip-b", blobKey: "take-b", start: 0, duration: 1, gain: 2 }] };
  const next = { ...project, tracks: [{ ...project.tracks[0], muted: false }, secondTrack] };
  const result = mixTimelineBuffers(next, new Map([["take-a", new Float32Array([0.2, 0.2, 0.2, 0.2])], ["take-b", new Float32Array([0.3, 0.3, 0.3, 0.3])]]), { sampleRate: 4 });
  assert.equal(result.clipCount, 1);
  assert.equal(result.left[0] > result.right[0], true);
  assert.equal(result.left[0] > 0.3, true);
});

test("mixdown limita headroom e exporta WAV estéreo", async () => {
  const { project } = fixture();
  const result = mixdownBuffersToWav(project, new Map([["take-a", new Float32Array([1, 1, 1, 1])]]), { sampleRate: 4, headroom: 0.8 });
  assert.equal(result.wav.type, "audio/wav");
  assert.equal(result.peakAfterHeadroom <= 0.8 + 1e-6, true);
  const bytes = new Uint8Array(await result.wav.arrayBuffer());
  assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), "RIFF");
  assert.equal(new TextDecoder().decode(bytes.slice(8, 12)), "WAVE");
});
