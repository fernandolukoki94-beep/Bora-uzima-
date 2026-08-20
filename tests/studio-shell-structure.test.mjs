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

test("Studio views keep focused DAW areas instead of stacking every module", () => {
  assert.match(shell, /timeline: \["timeline", "mixer-panel", "instrument-lab", "sound-library"\]/);
  assert.match(shell, /"instrument-lab": \["instrument-lab", "mixer-panel"\]/);
  assert.match(shell, /"beat-maker": \["beat-maker", "timeline", "mixer-panel"\]/);
  assert.match(shell, /"my-sounds": \["my-sounds", "timeline", "mixer-panel"\]/);
  assert.match(shell, /function mountDawWorkspace\(\)/);
  assert.match(shell, /editor\.append\(timeline, midiStrip, instrument\)/);
  assert.match(shell, /mixerDock\.appendChild\(mixer\)/);
});
test("Arrangement mounts a compact real MIDI strip", () => {
  const styles = fs.readFileSync(path.join(root, "src/css/styles.css"), "utf8");
  assert.match(shell, /id = "daw-midi-strip"/);
  assert.match(shell, /instrument\.querySelector\("#keyboard-notes"\)/);
  assert.match(shell, /instrument\.querySelector\("#piano-roll"\)/);
  assert.match(shell, /keep\.add\("daw-midi-strip"\)/);
  assert.match(styles, /daw-editor-dock > #daw-midi-strip/);
  assert.match(styles, /\[data-studio-view="timeline"\] \.daw-editor-dock > #instrument-lab/);
});

test("instrument actions await timeline materialization and expose working feedback", () => {
  assert.match(app, /if \(beatGrid\) applyBeatGridPreset\(beatPreset\?\.value \|\| "Afrobeat"\)/);
  assert.match(app, /await ensureAudioContextRunning\(\);[\s\S]*showToast\(`Piano · acorde/);
  assert.match(app, /showToast\(`Guitarra · acorde/);
  assert.match(app, /showToast\(added \? `Beat Maker · \$\{preset\.name\} materializado/);
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
  assert.match(shell, /document\.querySelectorAll\("\.nav-links a, \.studio-step, \.studio-transport-bar a, \.studio-sidebar-export, \[data-studio-area\]"\)/);
  assert.doesNotMatch(shell, /document\.querySelectorAll\("\[data-studio-area\]"\)\.forEach\(\(item\) => \{\s*item\.addEventListener/);
});

test("recording workspace has a full-width setup layout", () => {
  const styles = fs.readFileSync(path.join(root, "src/css/styles.css"), "utf8");
  assert.match(styles, /data-studio-view="recording-workspace"[\s\S]*grid-template-columns: minmax\(0, 1\.08fr\) minmax\(360px, \.92fr\)/);
  assert.match(styles, /data-studio-view="recording-workspace"[\s\S]*recording-metrics/);
});

test("new production sessions expose real empty DAW tracks", () => {
  assert.match(app, /const preparedTracks = \[/);
  assert.match(app, /name: "Beat Maker", type: "drums"/);
  assert.match(app, /name: "Instrumento", type: "instrument"/);
  assert.match(app, /name: "Guitarra", type: "guitar"/);
  assert.match(app, /reduce\(\(project, track\) => addTrack\(project, track\), base\)/);
  assert.match(app, /window\.addEventListener\("fernando-authenticated", \(\) => \{[\s\S]*ensureProductionSession\("Nova sessão de produção"\)[\s\S]*renderTimeline\(\);[\s\S]*renderMixer\(project\);/);
});

test("Timeline playback resolves persisted recording clips from IndexedDB", () => {
  assert.match(app, /async function audioSourceForClip\(project, clip\)/);
  assert.match(app, /clip\?\.blobKey\?\.startsWith\(`\$\{project\?\.id\}:`\)/);
  assert.match(app, /await getAudioBlob\(project\.id, kind\)/);
  assert.match(app, /async function scheduleTimelineAudio\(project, startPosition\)/);
  assert.match(app, /const scheduleToken = transportScheduleToken/);
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
  assert.match(styles, /height: calc\(100vh - 182px\)/);
  assert.match(styles, /data-studio-view="instrument-lab"/);
  assert.match(styles, /data-studio-view="beat-maker"/);
});
