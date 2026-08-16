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
  const waveform = instrument === "guitar" ? "triangle" : "sine";
  const amplitude = clamp(velocity, 0, 1) * (instrument === "guitar" ? 0.12 : 0.1);
  addTone(buffer, frequency, start, duration, amplitude, sampleRate, waveform);
  if (instrument === "guitar") addTone(buffer, frequency * 2, start, duration * 0.65, amplitude * 0.18, sampleRate, waveform);
}

function drumFrequency(instrument) {
  return { kick: 90, snare: 180, clap: 260, hihat: 5200, percussion: 880, bass: 65 }[instrument] || 300;
}

function addKick(buffer, start, sampleRate, velocity = 0.8) {
  const duration = 0.24;
  const begin = Math.max(0, Math.floor(start * sampleRate));
  const frames = Math.min(buffer.length - begin, Math.ceil(duration * sampleRate));
  if (frames <= 0) return;
  const amplitude = 0.52 * clamp(velocity, 0, 1);
  let phase = 0;
  for (let index = 0; index < frames; index += 1) {
    const progress = index / Math.max(1, frames - 1);
    const frequency = 155 * Math.pow(48 / 155, Math.min(1, progress * 2.6));
    phase += (2 * Math.PI * frequency) / sampleRate;
    const body = Math.sin(phase);
    const sub = Math.sin(phase * 0.5) * 0.18;
    const attack = Math.min(1, (index + 1) / Math.max(1, Math.ceil(sampleRate * 0.004)));
    const envelope = Math.pow(1 - progress, 2.15) * attack;
    buffer[begin + index] += (body + sub) * amplitude * envelope;
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
  const duration = instrument === "bass" ? 0.22 : 0.07;
  const amplitude = clamp(event.velocity, 0, 1) * (instrument === "hihat" ? 0.075 : instrument === "bass" ? 0.25 : 0.2);
  addTone(buffer, drumFrequency(instrument), event.time || 0, duration, amplitude, sampleRate, instrument === "bass" ? "sine" : "triangle");
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
  if (event.kind === "note" || event.note) {
    renderNote(buffer, event.note || event.pitch, event.start || 0, eventDuration(event, Math.min(0.35, duration)), sampleRate, instrument, event.velocity);
    return buffer;
  }
  const notes = event.notes || CHORDS[event.chord] || [];
  notes.forEach((note) => renderNote(buffer, note, event.start || 0, eventDuration(event, Math.min(1.2, duration)), sampleRate, instrument, event.velocity));
  return buffer;
}

export function isInstrumentClip(clip = {}) {
  return Boolean(clip.event || clip.metadata || clip.type === "instrument" || clip.type === "piano" || clip.type === "guitar" || clip.type === "drums");
}
