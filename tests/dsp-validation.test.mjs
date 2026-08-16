import test from "node:test";
import assert from "node:assert/strict";
import { audioBufferToWav, calculateSafeGain, getPeak } from "../src/js/effects.js";

function fakeAudioBuffer(channels, sampleRate, channelData) {
  return {
    numberOfChannels: channels,
    sampleRate,
    length: channelData[0].length,
    duration: channelData[0].length / sampleRate,
    getChannelData(channel) {
      return channelData[channel];
    },
  };
}

async function readWavHeader(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  return {
    riff: new TextDecoder().decode(bytes.slice(0, 4)),
    wave: new TextDecoder().decode(bytes.slice(8, 12)),
    channels: view.getUint16(22, true),
    sampleRate: view.getUint32(24, true),
    bitsPerSample: view.getUint16(34, true),
    dataSize: view.getUint32(40, true),
    byteLength: bytes.byteLength,
  };
}

test("exporta WAV PCM com header e metadados preservados", async () => {
  const source = fakeAudioBuffer(2, 48000, [
    new Float32Array([0, 0.25, -0.25, 0]),
    new Float32Array([0, -0.5, 0.5, 0]),
  ]);
  const wav = audioBufferToWav(source);
  const header = await readWavHeader(wav);

  assert.equal(wav.type, "audio/wav");
  assert.equal(header.riff, "RIFF");
  assert.equal(header.wave, "WAVE");
  assert.equal(header.channels, 2);
  assert.equal(header.sampleRate, 48000);
  assert.equal(header.bitsPerSample, 16);
  assert.equal(header.dataSize, source.length * source.numberOfChannels * 2);
  assert.equal(header.byteLength, 44 + header.dataSize);
});

test("mede pico estéreo e preserva duração lógica", () => {
  const source = fakeAudioBuffer(2, 44100, [
    new Float32Array([0.2, -0.75, 0.1]),
    new Float32Array([0.4, 0.5, -0.3]),
  ]);

  assert.equal(getPeak(source), 0.75);
  assert.equal(source.length / source.sampleRate, 3 / 44100);
});

test("limita ganho solicitado quando o pico excede o headroom", () => {
  const source = fakeAudioBuffer(1, 44100, [new Float32Array([0.9, -0.8])]);
  const result = calculateSafeGain(source, 1.4125, 0.98);

  assert.ok(Math.abs(result.peak - 0.9) < 1e-6);
  assert.ok(result.appliedGain < result.requestedGain);
  assert.ok(result.appliedGain * result.peak <= 0.98 + Number.EPSILON);
  assert.equal(result.limited, true);
});
