import test from "node:test";
import assert from "node:assert/strict";
import { createBeatEvents, createGridEvents, stepDurationSeconds } from "../src/js/studio/sequencer.js";

test("constrói eventos de Beat Maker com tempo e duração determinísticos", () => {
  const sequence = createBeatEvents({ pattern: "Kuduro", bpm: 128, bars: 2 });
  assert.equal(sequence.pattern, "Kuduro");
  assert.equal(sequence.bpm, 128);
  assert.equal(sequence.events.length > 0, true);
  assert.equal(sequence.duration, 32 * stepDurationSeconds(128));
  assert.equal(sequence.events[0].time, 0);
  assert.equal(sequence.events.at(-1).time < sequence.duration, true);
});

test("usa fallback seguro para padrão e limites de BPM", () => {
  const sequence = createBeatEvents({ pattern: "desconhecido", bpm: 999, bars: 0 });
  assert.equal(sequence.pattern, "Afrobeat");
  assert.equal(sequence.bpm, 240);
  assert.equal(sequence.bars, 1);
});

test("normaliza grid personalizado, remove duplicados e ordena eventos", () => {
  const sequence = createGridEvents({
    bpm: 100,
    bars: 1,
    channels: { snare: [4, 4, 99], kick: [0, 8], hihat: [2] },
  });
  assert.deepEqual(sequence.events.map((event) => `${event.instrument}:${event.step}`), [
    "kick:0", "hihat:2", "snare:4", "kick:8",
  ]);
});
