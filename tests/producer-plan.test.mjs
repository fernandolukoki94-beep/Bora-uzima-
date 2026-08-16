import assert from "node:assert/strict";
import test from "node:test";
import { applyProducerMix, buildProducerPlan, producerPlanClipSpecs } from "../src/js/producer-plan.js";
import { createProject } from "../src/js/studio/project-model.js";

test("Producer Plan cria uma proposta determinística de produção local", () => {
  const plan = buildProducerPlan({ genre: "Afrobeat", tempo: 104, key: "A minor", duration: 60 });
  assert.equal(plan.version, "producer-plan-v1");
  assert.equal(plan.genre, "Afrobeat");
  assert.equal(plan.bpm, 104);
  assert.equal(plan.key, "A minor");
  assert.deepEqual(plan.structure, ["intro", "verse", "chorus", "verse", "chorus", "outro"]);
  assert.ok(plan.instruments.includes("bass"));
  assert.equal(plan.vocal.compression, "medium");
  assert.equal(plan.mix.bassDb, -2);
  assert.equal(plan.mix.instrumentalDb, -4);
  assert.equal(plan.execution.localOnly, true);
  assert.equal(plan.execution.originalPreserved, true);
});

test("Producer Plan transforma o género em clips locais sem áudio externo", () => {
  const plan = buildProducerPlan({ genre: "Amapiano", tempo: 112, key: "C", duration: 30 });
  const clips = producerPlanClipSpecs(plan, 8);
  assert.ok(clips.some((clip) => clip.type === "drums"));
  assert.ok(clips.some((clip) => clip.metadata?.instrument === "bass"));
  assert.ok(clips.every((clip) => clip.metadata?.producerPlan === true));
});

test("Producer Plan aplica headroom de instrumentos sem destruir o original vocal", () => {
  const project = createProject({ id: "producer-plan-project", tempo: 100, key: "C" });
  const plan = buildProducerPlan({ genre: "R&B", tempo: 108, key: "A minor", duration: 20 });
  const next = applyProducerMix(project, plan);
  assert.equal(next.tempo, 108);
  assert.equal(next.key, "A minor");
  assert.equal(next.producerPlan.version, "producer-plan-v1");
  assert.equal(next.tracks[0].volume, 1);
  assert.equal(next.originalAudioData, project.originalAudioData);
});


test("interprets a Portuguese production brief deterministically", () => {
  const plan = buildProducerPlan({
    genre: "Demo vocal",
    brief: "Afrobeat dançante com guitarra, bass presente, Auto-Tune e master quente",
    duration: 30,
  });
  assert.equal(plan.genre, "Afrobeat");
  assert.equal(plan.briefInterpretation.energy, "high");
  assert.ok(plan.briefInterpretation.requestedInstruments.includes("guitar"));
  assert.ok(plan.briefInterpretation.requestedInstruments.includes("bass"));
  assert.equal(plan.briefInterpretation.requestedProcessing.pitchCorrection, true);
  assert.equal(plan.briefInterpretation.requestedProcessing.mastering, true);
});

test("keeps an empty production brief backward compatible", () => {
  const plan = buildProducerPlan({ genre: "Afrobeat", brief: "" });
  assert.equal(plan.brief, "");
  assert.equal(plan.briefInterpretation.energy, "medium");
});

test("Producer Plan materializa a paleta completa de seis instrumentos locais", () => {
  const plan = buildProducerPlan({ genre: "Afrobeat", tempo: 104, key: "A minor", duration: 30 });
  const clips = producerPlanClipSpecs(plan, 8);
  const expected = ["drums", "bass", "piano", "guitar", "strings", "synth"];
  assert.deepEqual(plan.instruments, expected);
  assert.deepEqual(
    clips.map((clip) => clip.metadata?.instrument),
    expected,
  );
  assert.ok(clips.every((clip) => clip.metadata?.producerPlan === true));
});

test("Direcção de Produção transforma briefing em arranjo e instrumentalização automáticos", () => {
  const plan = buildProducerPlan({
    genre: "Demo vocal",
    brief: "Afrobeat dançante com guitarra, baixo e synth, voz clara e master quente",
    tempo: 104,
    key: "A minor",
    duration: 45,
  });
  assert.equal(plan.arrangement.mode, "automatic");
  assert.deepEqual(plan.structure, ["intro", "verse", "chorus", "outro"]);
  assert.ok(plan.arrangement.sections.some((section) => section.name === "chorus" && section.intensity > 0.8));
  assert.ok(plan.instruments.includes("guitar"));
  assert.ok(plan.instruments.includes("bass"));
  assert.ok(plan.instruments.includes("synth"));
  assert.equal(plan.mix.mastering.limiter.ceiling, 0.89);
});
