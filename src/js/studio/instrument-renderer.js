import { CHORDS, midiToFrequency, noteToFrequency } from "./instruments.js";
import { createBeatEvents } from "./sequencer.js";

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

function renderDrum(buffer, event, sampleRate) {
  const duration = event.instrument === "kick" || event.instrument === "bass" ? 0.18 : 0.07;
  const amplitude = clamp(event.velocity, 0, 1) * (event.instrument === "hihat" ? 0.045 : 0.12);
  addTone(buffer, drumFrequency(event.instrument), event.time || 0, duration, amplitude, sampleRate, event.instrument === "kick" || event.instrument === "bass" ? "sine" : "triangle");
}

export function renderInstrumentClip(clip = {}, { sampleRate = 44100, tempo = 100 } = {}) {
  const duration = Math.max(0, Number(clip.duration || 0));
  const buffer = new Float32Array(Math.ceil(duration * sampleRate));
  const event = clip.event || clip.metadata || {};
  const instrument = event.instrument || clip.instrument || clip.type;
  if (!buffer.length) return buffer;
  if (instrument === "drums" || instrument === "beat") {
    const sequence = event.events
      ? { events: event.events }
      : createBeatEvents({ pattern: event.preset || "Afrobeat", bpm: event.bpm || tempo, bars: event.bars || 1, channels: event.channels }).events.length
        ? createBeatEvents({ pattern: event.preset || "Afrobeat", bpm: event.bpm || tempo, bars: event.bars || 1 }).events
        : [];
    sequence.forEach((item) => renderDrum(buffer, item, sampleRate));
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
