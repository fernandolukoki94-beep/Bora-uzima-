import { createPatternSequence, DRUM_PATTERNS } from "./instruments.js";

export function clampBpm(bpm) {
  return Math.max(40, Math.min(240, Number(bpm) || 100));
}

export function stepDurationSeconds(bpm = 100) {
  return 60 / clampBpm(bpm) / 4;
}

export function createBeatEvents({ pattern = "Afrobeat", bpm = 100, bars = 1 } = {}) {
  const safeBars = Math.max(1, Math.floor(Number(bars) || 1));
  const events = createPatternSequence(pattern, safeBars);
  const secondsPerStep = stepDurationSeconds(bpm);
  return {
    pattern: DRUM_PATTERNS[pattern] ? pattern : "Afrobeat",
    bpm: clampBpm(bpm),
    bars: safeBars,
    secondsPerStep,
    duration: safeBars * 16 * secondsPerStep,
    events: events.map((event, index) => ({
      id: `beat-${index}`,
      type: "drum",
      instrument: event.instrument,
      step: event.start,
      time: event.start * secondsPerStep,
      velocity: event.velocity,
    })),
  };
}

export function createGridEvents({ channels = {}, bpm = 100, bars = 1 } = {}) {
  const safeBars = Math.max(1, Math.floor(Number(bars) || 1));
  const safeBpm = clampBpm(bpm);
  const secondsPerStep = stepDurationSeconds(safeBpm);
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
        step,
        time: step * secondsPerStep,
        velocity: 0.8,
      }));
  });
  events.sort((a, b) => a.time - b.time || a.instrument.localeCompare(b.instrument));
  return { bpm: safeBpm, bars: safeBars, secondsPerStep, duration: safeBars * 16 * secondsPerStep, events };
}
