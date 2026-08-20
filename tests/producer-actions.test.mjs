
import test from "node:test";
import assert from "node:assert/strict";
import { buildProducerActionPlan, producerActionLabel, producerActionRequiresAudio, producerActionRequiresMixed } from "../src/js/producer-actions.js";

const basePlan = { genre: "Afrobeat", bpm: 100, key: "C", duration: 16, instruments: ["piano", "guitar"] };

test("AI Producer expõe seis acções com labels operacionais", () => {
  assert.equal(producerActionLabel("analyze-vocal"), "Analyze vocal");
  assert.equal(producerActionLabel("generate-drums"), "Generate drums");
  assert.equal(producerActionLabel("create-bassline"), "Create bassline");
  assert.equal(producerActionLabel("improve-arrangement"), "Improve arrangement");
  assert.equal(producerActionLabel("mix-vocals"), "Mix vocals");
  assert.equal(producerActionLabel("master-track"), "Master track");
});

test("acções instrumentais produzem planos locais materializáveis", () => {
  assert.deepEqual(buildProducerActionPlan(basePlan, "generate-drums").instruments, ["drums"]);
  assert.deepEqual(buildProducerActionPlan(basePlan, "create-bassline").instruments, ["bass"]);
  assert.deepEqual(buildProducerActionPlan(basePlan, "improve-arrangement").instruments, ["drums", "bass", "piano", "guitar", "strings", "synth"]);
  assert.equal(buildProducerActionPlan(basePlan, "generate-drums").execution.localOnly, true);
  assert.equal(buildProducerActionPlan(basePlan, "generate-drums").execution.originalPreserved, true);
});

test("acções de áudio exigem fonte real e mastering exige Mixed", () => {
  assert.equal(producerActionRequiresAudio("analyze-vocal"), true);
  assert.equal(producerActionRequiresAudio("mix-vocals"), true);
  assert.equal(producerActionRequiresAudio("master-track"), true);
  assert.equal(producerActionRequiresMixed("master-track"), true);
  assert.equal(producerActionRequiresMixed("mix-vocals"), false);
});

import fs from "node:fs";

test("UI do Producer está ligada a handlers reais", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../src/js/app.js", import.meta.url), "utf8");
  for (const action of ["analyze-vocal", "generate-drums", "create-bassline", "improve-arrangement", "mix-vocals", "master-track"]) {
    assert.match(html, new RegExp(`data-producer-action=["']${action}["']`));
  }
  assert.match(app, /async function executeProducerAction\(action\)/);
  assert.match(app, /buildProducerActionPlan\(basePlan, action\)/);
  assert.match(app, /await mixdownActiveTimeline\(\)/);
  assert.match(app, /await applyMasteringFromUi\(\)/);
});
