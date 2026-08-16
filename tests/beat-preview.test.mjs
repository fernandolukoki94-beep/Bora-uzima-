import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const audioEngine = fs.readFileSync(new URL("../src/js/studio/audio-engine.js", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../src/js/app.js", import.meta.url), "utf8");
const renderer = fs.readFileSync(new URL("../src/js/studio/instrument-renderer.js", import.meta.url), "utf8");

test("Beat Maker usa preview dedicado para cada canal", () => {
  assert.match(audioEngine, /export async function playDrumHit/);
  assert.match(app, /playDrumHit\(channel/);
  for (const channel of ["kick", "snare", "clap", "hihat", "percussion", "bass"]) {
    assert.match(audioEngine, new RegExp(`\\"${channel}\\"`));
  }
});

test("renderer offline mantém todos os canais de bateria", () => {
  for (const channel of ["kick", "snare", "clap", "hihat", "percussion", "bass"]) {
    assert.match(renderer, new RegExp(channel));
  }
});

test("preview de bateria não depende do mapa de notas do piano", () => {
  assert.doesNotMatch(app.match(/beatGrid\?\.addEventListener\([\s\S]*?\}\);\n\s*pianoRoll/)[0], /frequencies\s*=/);
});
