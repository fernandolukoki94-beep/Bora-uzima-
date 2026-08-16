import assert from "node:assert/strict";
import test from "node:test";
import { formatPreflightSummary, runMobilePreflight } from "../src/js/mobile-preflight.js";

const fullEnvironment = {
  MediaRecorder: function MediaRecorder() {},
  AudioContext: function AudioContext() {},
  OfflineAudioContext: function OfflineAudioContext() {},
  indexedDB: {},
  navigator: { mediaDevices: { getUserMedia() {} } },
  URL: { createObjectURL() {} },
};

test("preflight aprova o conjunto de APIs móveis disponível", () => {
  const result = runMobilePreflight(fullEnvironment);
  assert.equal(result.supported, true);
  assert.deepEqual(result.unsupported, []);
  assert.match(formatPreflightSummary(result), /6\/6/);
});

test("preflight identifica microfone e IndexedDB ausentes", () => {
  const result = runMobilePreflight({ MediaRecorder: fullEnvironment.MediaRecorder });
  assert.equal(result.supported, false);
  assert.deepEqual(result.unsupported, ["audioContext", "offlineAudioContext", "indexedDb", "mediaDevices", "blobUrl"]);
  assert.match(formatPreflightSummary(result), /pendentes/);
});
