import { CHORDS, midiToFrequency, noteToFrequency } from "./instruments.js";
import { createBeatEvents, createGridEvents } from "./sequencer.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function eventDuration(event, fallback = 0.35) {
  return Math.max(0.03, Number(event?.duration) || fallback);
}

function addTone(buffer, frequency, start, duration, amplitude, sampleRate, waveform = "sine") {
  const begin = Math.max(0, Math.floor(start * sampleRate));
  const frames = Math.min(buffer.length - begin, Math.ceil(duration * sampleRate));
  if (frames <= 0) return;
  const attack = Math.min(Math.ceil(0.015 * sampleRate), Math.max(1, frames / 4));
  for (let index = 0; index < frames; index += 1) {
    const phase = 2 * Math.PI * frequency * (index / sampleRate);
    const raw = waveform === "triangle" ? (2 / Math.PI) * Math.asin(Math.sin(phase)) : Math.sin(phase);
    const release = Math.max(1, frames * 0.18);
    const envelope = Math.min(1, (index + 1) / attack, (frames - index) / release);
    buffer[begin + index] += raw * amplitude * envelope;
  }
}

function renderNote(buffer, note, start, duration, sampleRate, instrument = "piano", velocity = 0.8) {
  const frequency = typeof note === "number" ? midiToFrequency(note) : noteToFrequency(note);
  const waveform = instrument === "guitar" ? "triangle" : instrument === "synth" ? "sawtooth" : instrument === "strings" ? "triangle" : "sine";
  const amplitude = clamp(velocity, 0, 1) * (instrument === "guitar" ? 0.15 : 0.12);
  addTone(buffer, frequency, start, duration, amplitude, sampleRate, waveform);
  if (instrument === "piano") {
    addTone(buffer, frequency * 2, start, duration * 0.72, amplitude * 0.24, sampleRate, "triangle");
    addTone(buffer, frequency * 3, start, duration * 0.42, amplitude * 0.08, sampleRate, "sine");
  }
  if (instrument === "guitar") {
    addTone(buffer, frequency * 2, start, duration * 0.7, amplitude * 0.26, sampleRate, waveform);
    addTone(buffer, frequency * 3, start, duration * 0.42, amplitude * 0.08, sampleRate, "sine");
  }
}

function addNoiseHit(buffer, start, duration, sampleRate, amplitude, seed = 1) {
  const begin = Math.max(0, Math.floor(start * sampleRate));
  const frames = Math.min(buffer.length - begin, Math.ceil(duration * sampleRate));
  if (frames <= 0) return;
  for (let index = 0; index < frames; index += 1) {
    const progress = index / Math.max(1, frames - 1);
    const pseudo = Math.sin((index + 1) * 12.9898 + seed * 78.233) * 43758.5453;
    const noise = (pseudo - Math.floor(pseudo)) * 2 - 1;
    const envelope = Math.min(1, (index + 1) / Math.max(1, Math.ceil(sampleRate * 0.002))) * Math.pow(1 - progress, 2.2);
    buffer[begin + index] += noise * amplitude * envelope;
  }
}

function drumFrequency(instrument) {
  return { kick: 90, snare: 180, clap: 260, hihat: 5200, percussion: 880, bass: 65 }[instrument] || 300;
}

function addKick(buffer, start, sampleRate, velocity = 0.8) {
  const duration = 0.24;
  const begin = Math.max(0, Math.floor(start * sampleRate));
  const frames = Math.min(buffer.length - begin, Math.ceil(duration * sampleRate));
  if (frames <= 0) return;
  const amplitude = 0.72 * clamp(velocity, 0, 1);
  let phase = 0;
  for (let index = 0; index < frames; index += 1) {
    const progress = index / Math.max(1, frames - 1);
    const frequency = 185 * Math.pow(44 / 185, Math.min(1, progress * 2.8));
    phase += (2 * Math.PI * frequency) / sampleRate;
    const body = Math.sin(phase) * 0.94;
    const sub = Math.sin(phase * 0.5) * 0.28;
    const click = Math.sin(phase * 3) * Math.pow(1 - progress, 7) * 0.08;
    const attack = Math.min(1, (index + 1) / Math.max(1, Math.ceil(sampleRate * 0.004)));
    const envelope = Math.pow(1 - progress, 2.15) * attack;
    buffer[begin + index] += (body + sub + click) * amplitude * envelope;
  }
}

function addBass(buffer, start, sampleRate, velocity = 0.8) {
  const duration = 0.26;
  const begin = Math.max(0, Math.floor(start * sampleRate));
  const frames = Math.min(buffer.length - begin, Math.ceil(duration * sampleRate));
  if (frames <= 0) return;
  const amplitude = 0.42 * clamp(velocity, 0, 1);
  for (let index = 0; index < frames; index += 1) {
    const progress = index / Math.max(1, frames - 1);
    const envelope = Math.min(1, (index + 1) / Math.max(1, Math.ceil(sampleRate * 0.008))) * Math.pow(1 - progress, 1.45);
    const phase = 2 * Math.PI * (60 * index / sampleRate);
    const body = Math.sin(phase) * 0.72;
    const harmonic = (2 / Math.PI) * Math.asin(Math.sin(phase * 2)) * 0.2;
    const presence = Math.sin(phase * 3) * 0.11;
    buffer[begin + index] += (body + harmonic + presence) * amplitude * envelope;
  }
}

function normalizeDrumInstrument(instrument) {
  return instrument === "drum" || instrument === "drums" ? "kick" : instrument;
}

function renderDrum(buffer, event, sampleRate) {
  const instrument = normalizeDrumInstrument(event.instrument);
  if (instrument === "kick") {
    addKick(buffer, event.time || 0, sampleRate, event.velocity);
    return;
  }
  if (instrument === "bass") {
    addBass(buffer, event.time || 0, sampleRate, event.velocity);
    return;
  }
  const velocity = clamp(event.velocity, 0, 1);
  const duration = instrument === "hihat" ? 0.055 : instrument === "clap" ? 0.12 : 0.09;
  if (instrument === "hihat") {
    addNoiseHit(buffer, event.time || 0, duration, sampleRate, 0.11 * velocity, 5);
    return;
  }
  if (instrument === "snare" || instrument === "clap") {
    addNoiseHit(buffer, event.time || 0, duration, sampleRate, (instrument === "clap" ? 0.22 : 0.18) * velocity, instrument === "clap" ? 7 : 3);
    addTone(buffer, drumFrequency(instrument), event.time || 0, duration * 0.72, 0.09 * velocity, sampleRate, "triangle");
    return;
  }
  addNoiseHit(buffer, event.time || 0, duration, sampleRate, 0.13 * velocity, 11);
  addTone(buffer, drumFrequency(instrument), event.time || 0, duration, 0.13 * velocity, sampleRate, "triangle");
}

export function renderInstrumentClip(clip = {}, { sampleRate = 44100, tempo = 100 } = {}) {
  const duration = Math.max(0, Number(clip.duration || 0));
  const buffer = new Float32Array(Math.ceil(duration * sampleRate));
  const event = clip.event || clip.metadata || {};
  const instrument = event.instrument || clip.instrument || clip.type;
  if (!buffer.length) return buffer;
  if (instrument === "drums" || instrument === "drum" || instrument === "beat") {
    const sequence = event.events
      ? { events: event.events }
      : event.channels
        ? createGridEvents({ channels: event.channels, bpm: event.bpm || tempo, bars: event.bars || 1 })
        : createBeatEvents({ pattern: event.preset || "Afrobeat", bpm: event.bpm || tempo, bars: event.bars || 1 });
    sequence.events.forEach((item) => renderDrum(buffer, item, sampleRate));
    return buffer;
  }
  if (event.events && Array.isArray(event.events)) {
    event.events.forEach((item) => {
      if (!item?.note && !item?.pitch) return;
      renderNote(buffer, item.note || item.pitch, item.time ?? item.start ?? 0, eventDuration(item, Math.min(0.35, duration)), sampleRate, item.instrument || instrument, item.velocity);
    });
    return buffer;
  }
  if (event.kind === "note" || event.note) {
    renderNote(buffer, event.note || event.pitch, event.start || 0, eventDuration(event, Math.min(0.35, duration)), sampleRate, instrument, event.velocity);
    return buffer;
  }
  const notes = event.notes || CHORDS[event.chord] || [];
  notes.forEach((note) => renderNote(buffer, note, event.start || 0, eventDuration(event, Math.min(1.2, duration)), sampleRate, instrument, event.velocity));
  return buffer;
}

export function isInstrumentClip(clip = {}) {
  return Boolean(clip.event || clip.metadata || clip.type === "instrument" || clip.type === "piano" || clip.type === "guitar" || clip.type === "strings" || clip.type === "synth" || clip.type === "drums");
}
