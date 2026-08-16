import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { addClip, addTrack, createProject, updateTrack } from "../src/js/studio/project-model.js";
import { mixTimelineBuffers } from "../src/js/studio/mixdown.js";

const rate = 44100;

function readPcm16(path) {
  const data = fs.readFileSync(path);
  assert.equal(data.toString("ascii", 0, 4), "RIFF");
  assert.equal(data.toString("ascii", 8, 12), "WAVE");
  assert.equal(data.readUInt16LE(20), 1);
  const channels = data.readUInt16LE(22);
  const sampleRate = data.readUInt32LE(24);
  const bits = data.readUInt16LE(34);
  const dataOffset = data.indexOf(Buffer.from("data"));
  const byteLength = data.readUInt32LE(dataOffset + 4);
  const samples = new Float32Array(byteLength / (bits / 8) / channels);
  for (let index = 0; index < samples.length; index += 1) samples[index] = data.readInt16LE(dataOffset + 8 + index * channels * 2) / 32768;
  return { channels, sampleRate, bits, samples, duration: samples.length / sampleRate };
}

function peak(buffer) {
  return Math.max(0, ...Array.from(buffer, (value) => Math.abs(value)));
}

test("fixtures WAV têm formato PCM, 44.1 kHz e não são silenciosas", () => {
  for (const name of ["voice.wav", "beat.wav", "stereo-test.wav"]) {
    const fixture = readPcm16(`test-audio/${name}`);
    assert.equal(fixture.sampleRate, rate);
    assert.equal(fixture.bits, 16);
    assert.ok(fixture.channels === 1 || fixture.channels === 2);
    assert.ok(fixture.duration > 0);
    assert.ok(peak(fixture.samples) > 0.01);
  }
});

test("sessão real-world vocal + beat + piano + guitarra chega ao WAV final", () => {
  const voice = readPcm16("test-audio/voice.wav");
  let project = createProject({ id: "real-world", tempo: 104 });
  const vocalId = project.tracks[0].id;
  project = updateTrack(project, vocalId, { name: "Vocal", volume: 10 ** (-2 / 20), pan: 0 });
  project = addClip(project, vocalId, { id: "voice-clip", blobKey: "voice", start: 0, duration: voice.duration, fadeIn: 0.02, fadeOut: 0.05 });
  project = addTrack(project, { id: "beat", name: "Beat", type: "drums", volume: 10 ** (-4 / 20), pan: 0 });
  project = addClip(project, "beat", { id: "beat-clip", type: "drums", duration: 2, event: { instrument: "drums", preset: "Afrobeat", bpm: 104 } });
  project = addTrack(project, { id: "piano", name: "Piano", type: "piano", volume: 10 ** (-6 / 20), pan: -0.1 });
  project = addClip(project, "piano", { id: "piano-clip", type: "instrument", duration: 2, event: { instrument: "piano", chord: "C" } });
  project = addTrack(project, { id: "guitar", name: "Guitarra", type: "guitar", volume: 10 ** (-5 / 20), pan: 0.1 });
  project = addClip(project, "guitar", { id: "guitar-clip", type: "guitar", duration: 2, event: { instrument: "guitar", chord: "Am" } });
  const result = mixTimelineBuffers(project, new Map([["voice", voice.samples]]), { sampleRate: rate });
  assert.equal(result.sampleRate, rate);
  assert.equal(result.clipCount, 4);
  assert.equal(result.left.length, rate * 2);
  assert.ok(peak(result.left) > 0.01 || peak(result.right) > 0.01);
  assert.ok(result.peakAfterHeadroom <= 0.98 + 1e-6);
  assert.ok(result.scale <= 1);
});
