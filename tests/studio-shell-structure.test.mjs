import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const shell = fs.readFileSync(path.join(root, "src/js/studio-shell.js"), "utf8");

test("recording workspace points to the real recording console", () => {
  assert.match(html, /<div id="studio-help-strip" class="help-strip"/);
  assert.match(html, /<div class="workspace" id="recording-workspace"/);
  assert.doesNotMatch(html, /<div id="recording-workspace" class="help-strip"/);
});

test("Studio and Mix keep the Control Room with timeline and mixer", () => {
  assert.match(shell, /timeline: \["control-room", "timeline", "mixer-panel"\]/);
  assert.match(shell, /"mixer-panel": \["control-room", "timeline", "mixer-panel"\]/);
});

test("primary sidebar destinations have explicit studio area targets", () => {
  for (const target of ["projects-panel", "recording-workspace", "instrument-lab", "producer-studio", "timeline", "mixer-panel", "community-panel", "profile-panel"]) {
    assert.match(html, new RegExp(`data-studio-area="${target}"`));
  }
});
