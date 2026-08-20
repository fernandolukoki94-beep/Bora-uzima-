import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/js/recorder.js", import.meta.url), "utf8");

test("recorder suporta AudioContext WebKit e retoma o contexto de monitorização", () => {
  assert.match(source, /window\.AudioContext\s*\|\|\s*window\.webkitAudioContext/);
  assert.match(source, /audioContext\.resume/);
});

test("recorder limpa o estado mesmo quando onComplete falha", () => {
  assert.match(source, /try \{\s*await onComplete/s);
  assert.match(source, /finally \{[\s\S]*recorder = null/);
  assert.match(source, /finally \{[\s\S]*stopMetering\(\)/);
});
