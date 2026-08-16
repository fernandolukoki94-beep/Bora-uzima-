import assert from "node:assert/strict";
import { test } from "node:test";
import { buildProducerPlan } from "../src/js/producer-plan.js";
import { materializeProducerPlan, trackOrigin } from "../src/js/producer-arrangement.js";
import { addClip, addTrack, normalizeProject } from "../src/js/studio/project-model.js";

function fixture() {
  let project = normalizeProject({
    id: "project-v21",
    name: "V2.1 E2E",
    duration: 8,
    tempo: 100,
    key: "C",
    originalAudioData: "data:audio/wav;base64,AAAA",
    originalMimeType: "audio/wav",
  });
  project = addTrack(project, { name: "Voz", type: "audio", color: "#ffffff" });
  const vocalTrack = project.tracks[0];
  return addClip(project, vocalTrack.id, {
    name: "Original",
    duration: 8,
    blobKey: "project-v21:original",
    mimeType: "audio/wav",
  });
}

test("Producer Plan materializa os seis instrumentos na timeline", () => {
  const project = fixture();
  const plan = buildProducerPlan({ genre: "Afrobeat", tempo: 102, key: "A minor", duration: 8, brief: "Afrobeat com bass, guitarra, piano e drums" });
  const result = materializeProducerPlan(project, plan, { duration: 8 });
  const generated = result.tracks.flatMap((track) => track.clips.filter((clip) => clip.event?.producerPlan));
  assert.equal(generated.length, 6);
  assert.deepEqual(new Set(generated.map((clip) => clip.event.instrument)), new Set(["drums", "bass", "piano", "guitar", "strings", "synth"]));
  assert.equal(result.tempo, plan.bpm);
  assert.equal(result.key, plan.key);
  assert.equal(result.producerPlan.version, "producer-plan-v1");
});

test("a origem da track distingue Producer Plan de faixas manuais", () => {
  const project = fixture();
  const plan = buildProducerPlan({ genre: "Afrobeat", duration: 8 });
  const arranged = materializeProducerPlan(project, plan, { duration: 8 });
  const generatedTrack = arranged.tracks.find((track) => track.clips.some((clip) => clip.event?.producerPlan));
  const manualTrack = arranged.tracks.find((track) => track.name === "Voz");
  assert.equal(trackOrigin(generatedTrack), "producer-plan");
  assert.equal(trackOrigin(manualTrack), "manual");
});

test("reaplicar o plano não duplica clips gerados nem remove a voz original", () => {
  const project = fixture();
  const plan = buildProducerPlan({ genre: "Afrobeat", duration: 8 });
  const first = materializeProducerPlan(project, plan, { duration: 8 });
  const second = materializeProducerPlan(first, { ...plan, bpm: 104 }, { duration: 8 });
  const generated = second.tracks.flatMap((track) => track.clips.filter((clip) => clip.event?.producerPlan));
  const original = second.tracks.flatMap((track) => track.clips).find((clip) => clip.blobKey === "project-v21:original");
  assert.equal(generated.length, 6);
  assert.ok(original);
  assert.equal(second.tempo, 104);
});
