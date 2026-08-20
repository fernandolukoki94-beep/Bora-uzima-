import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const shell = fs.readFileSync(path.join(root, "src/js/studio-shell.js"), "utf8");
const app = fs.readFileSync(path.join(root, "src/js/app.js"), "utf8");

test("recording workspace points to the real recording console", () => {
  assert.match(html, /<div id="studio-help-strip" class="help-strip"/);
  assert.match(html, /<div class="workspace" id="recording-workspace"/);
  assert.doesNotMatch(html, /<div id="recording-workspace" class="help-strip"/);
});

test("Studio and Mix keep the DAW editor, browser and mixer together", () => {
  assert.match(shell, /timeline: \["timeline", "mixer-panel", "instrument-lab", "sound-library", "my-sounds", "beat-maker"\]/);
  assert.match(shell, /"mixer-panel": \["timeline", "mixer-panel", "instrument-lab", "sound-library", "my-sounds", "beat-maker"\]/);
  assert.match(shell, /function mountDawWorkspace\(\)/);
  assert.match(shell, /editor\.append\(timeline, instrument\)/);
  assert.match(shell, /mixerDock\.appendChild\(mixer\)/);
});

test("instrument actions await timeline materialization", () => {
  assert.match(app, /keyboardMidiRecord\?\.addEventListener\("click", async/);
  assert.match(app, /const added = await insertInstrumentClip\(\{ name: "Teclado · take MIDI"/);
  assert.match(app, /async function addPianoRollToTimeline\(\) \{[\s\S]*?const added = await insertInstrumentClip/);
  assert.match(app, /addBeatTimeline\?\.addEventListener\("click", async/);
  assert.match(app, /const added = await insertInstrumentClip\(\{ name: clip\.name, type: "instrument"/);
});

test("primary sidebar destinations have explicit studio area targets", () => {
  for (const target of ["projects-panel", "recording-workspace", "instrument-lab", "producer-studio", "timeline", "mixer-panel", "community-panel", "profile-panel"]) {
    assert.match(html, new RegExp(`data-studio-area="${target}"`));
  }
});

test("local-first persistence compacts binary clips and resolves vocal clips from My Sounds", () => {
  assert.match(app, /async function persistTimelineProjects\(projects\)/);
  assert.match(app, /await putAudioBlob\(project\.id, kind, await dataUrlToBlob\(clip\.audioData\)\)/);
  assert.match(app, /delete clip\.audioData/);
  assert.match(app, /async function resolveVocalSourceBlob\(project\)/);
  assert.match(app, /clip\.metadata\?\.origin === "my-sounds"/);
  assert.match(app, /const sourceData = await resolveVocalSourceData\(project\)/);
});

test("studio visual layer is scoped to the authenticated DAW shell", () => {
  const styles = fs.readFileSync(path.join(root, "src/css/styles.css"), "utf8");
  assert.match(styles, /body\.studio-ready \{[\s\S]*--daw-bg:/);
  assert.match(styles, /Professional Studio console pass/);
  assert.match(styles, /background-image: none/);
  assert.match(styles, /\.daw-workspace/);
  assert.match(styles, /grid-template-columns: 218px minmax\(0, 1fr\) 308px/);
});
