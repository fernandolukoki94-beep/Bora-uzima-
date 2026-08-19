import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveProducerStudioState } from "../src/js/producer-studio-flow.js";

describe("Producer Studio V2 flow", () => {
  it("starts empty without inventing analysis", () => {
    assert.deepEqual(deriveProducerStudioState(null), { hasProject: false, hasAnalysis: false, hasPlan: false, hasVocal: false, hasMix: false, hasMaster: false, confidence: 0 });
  });

  it("exposes heuristic analysis and manual overrides", () => {
    const state = deriveProducerStudioState({
      tempo: 100,
      key: "C",
      analysis: { hasAudio: true, bpm: 102, key: "Am", confidence: 0.82 },
      manualAnalysis: { bpm: 96, key: "Dm" },
    });
    assert.deepEqual({ hasProject: state.hasProject, hasAnalysis: state.hasAnalysis, bpm: state.bpm, key: state.key, confidence: state.confidence }, { hasProject: true, hasAnalysis: true, bpm: 96, key: "Dm", confidence: 0.82 });
  });

  it("marks the local path through Mixed while Mastering remains pending", () => {
    const state = deriveProducerStudioState({
      genre: "Afrobeat",
      productionBrief: "Bass presente",
      analysis: { bpm: 102, key: "Am", confidence: 0.78 },
      producerPlan: { genre: "Afrobeat" },
      processing: { state: "COMPLETED" },
      tracks: [{ id: "vocal", type: "audio" }, { id: "drums", type: "drums", clips: [{ metadata: { producerPlan: true } }] }],
      audioVariants: { enhanced: {}, pitchCorrected: {}, mixed: {} },
    });
    assert.deepEqual({ hasPlan: state.hasPlan, hasVocal: state.hasVocal, hasMix: state.hasMix, hasMaster: state.hasMaster, genre: state.genre }, { hasPlan: true, hasVocal: true, hasMix: true, hasMaster: false, genre: "Afrobeat" });
  });

  it("marks Mastering complete only when a mastered variant exists", () => {
    const state = deriveProducerStudioState({ audioVariants: { mixed: {}, mastered: {} } });
    assert.equal(state.hasMix, true);
    assert.equal(state.hasMaster, true);
  });
});
