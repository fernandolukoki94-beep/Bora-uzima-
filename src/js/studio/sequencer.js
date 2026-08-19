import { createPatternSequence, DRUM_PATTERNS } from "./instruments.js";

export function clampBpm(bpm) {
  return Math.max(40, Math.min(240, Number(bpm) || 100));
}

export function stepDurationSeconds(bpm = 100) {
  return 60 / clampBpm(bpm) / 4;
}

export const DRUM_KITS = {
  Acoustic: { kick: "Kick acústico", snare: "Snare acústico", clap: "Clap seco", hihat: "Hi-hat fechado", percussion: "Percussão natural", bass: "Bass round" },
  Electronic: { kick: "Kick electrónico", snare: "Snare bright", clap: "Clap wide", hihat: "Hi-hat digital", percussion: "Perc digital", bass: "Bass sub" },
  Afro: { kick: "Kick afro", snare: "Snare afro", clap: "Clap afro", hihat: "Shaker", percussion: "Agogo", bass: "Bass afro" },
};

export function normalizeSwing(value = 0) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

export function applySwingToStep(step, secondsPerStep, swing = 0) {
  const safeSwing = normalizeSwing(swing);
  return Number(step) * secondsPerStep + (Number(step) % 2 === 1 ? secondsPerStep * 0.5 * (safeSwing / 100) : 0);
}

function normalizeVelocity(value, fallback = 0.8) {
  return Math.max(0, Math.min(1, Number(value) || fallback));
}

export function createBeatEvents({ pattern = "Afrobeat", bpm = 100, bars = 1, kit = "Acoustic", swing = 0, velocity = 0.8, loop = false, loopCount = 1 } = {}) {
  const safeBars = Math.max(1, Math.floor(Number(bars) || 1));
  const events = createPatternSequence(pattern, safeBars);
  const safeBpm = clampBpm(bpm);
  const secondsPerStep = stepDurationSeconds(safeBpm);
  const safeKit = DRUM_KITS[kit] ? kit : "Acoustic";
  const safeVelocity = normalizeVelocity(velocity);
  const safeLoopCount = Math.max(1, Math.min(32, Math.floor(Number(loopCount) || 1)));
  const baseEvents = events.map((event, index) => ({
    id: `beat-${index}`,
    type: "drum",
    instrument: event.instrument,
    kit: safeKit,
    step: event.start,
    time: applySwingToStep(event.start, secondsPerStep, swing),
    velocity: normalizeVelocity(event.velocity, safeVelocity) * (safeVelocity / 0.8),
  }));
  const loopEvents = loop
    ? Array.from({ length: safeLoopCount }, (_, loopIndex) => baseEvents.map((event) => ({
      ...event,
      id: `${event.id}-loop-${loopIndex}`,
      time: event.time + loopIndex * safeBars * 16 * secondsPerStep,
    }))).flat()
    : baseEvents;
  return {
    pattern: DRUM_PATTERNS[pattern] ? pattern : "Afrobeat",
    kit: safeKit,
    bpm: safeBpm,
    bars: safeBars,
    swing: normalizeSwing(swing),
    loop: Boolean(loop),
    loopCount: safeLoopCount,
    secondsPerStep,
    duration: safeBars * 16 * secondsPerStep * (loop ? safeLoopCount : 1),
    events: loopEvents,
  };
}

export function createGridEvents({ channels = {}, bpm = 100, bars = 1, kit = "Acoustic", swing = 0, velocity = 0.8, loop = false, loopCount = 1 } = {}) {
  const safeBars = Math.max(1, Math.floor(Number(bars) || 1));
  const safeBpm = clampBpm(bpm);
  const secondsPerStep = stepDurationSeconds(safeBpm);
  const safeKit = DRUM_KITS[kit] ? kit : "Acoustic";
  const safeVelocity = normalizeVelocity(velocity);
  const safeLoopCount = Math.max(1, Math.min(32, Math.floor(Number(loopCount) || 1)));
  const events = [];
  Object.entries(channels).forEach(([instrument, steps]) => {
    [...new Set(Array.isArray(steps) ? steps : [])]
      .map((step) => Math.max(0, Math.floor(Number(step) || 0)))
      .filter((step) => step < safeBars * 16)
      .sort((a, b) => a - b)
      .forEach((step, index) => events.push({
        id: `grid-${instrument}-${step}-${index}`,
        type: "drum",
        instrument,
        kit: safeKit,
        step,
        time: applySwingToStep(step, secondsPerStep, swing),
        velocity: safeVelocity,
      }));
  });
  events.sort((a, b) => a.time - b.time || a.instrument.localeCompare(b.instrument));
  const loopEvents = loop
    ? Array.from({ length: safeLoopCount }, (_, loopIndex) => events.map((event) => ({
      ...event,
      id: `${event.id}-loop-${loopIndex}`,
      time: event.time + loopIndex * safeBars * 16 * secondsPerStep,
    }))).flat()
    : events;
  return {
    bpm: safeBpm,
    bars: safeBars,
    kit: safeKit,
    swing: normalizeSwing(swing),
    loop: Boolean(loop),
    loopCount: safeLoopCount,
    secondsPerStep,
    duration: safeBars * 16 * secondsPerStep * (loop ? safeLoopCount : 1),
    events: loopEvents,
  };
}
