import { CHORDS, noteToFrequency } from "./instruments.js";
import { createBeatEvents } from "./sequencer.js";

function getContext() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) throw new Error("Web Audio API indisponível");
  if (!getContext.instance) getContext.instance = new Context();
  return getContext.instance;
}

export async function playNote(note, { duration = 0.35, type = "triangle", volume = 0.16 } = {}) {
  const context = getContext();
  if (context.state === "suspended") await context.resume();
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const start = context.currentTime;
  const safeDuration = Math.max(0.08, duration);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(noteToFrequency(note), start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(type === "square" ? 4200 : 5600, start);
  filter.Q.setValueAtTime(0.35, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + Math.min(0.035, safeDuration * 0.18));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + safeDuration);
  oscillator.connect(filter).connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + safeDuration + 0.04);
}

export async function playChord(name, options = {}) {
  const notes = CHORDS[name] || CHORDS.C;
  await Promise.all(notes.map((note) => playNote(note, options)));
}

export function planSequenceEvents(sequence, startTime = 0) {
  const safeStart = Math.max(0, Number(startTime) || 0);
  return (sequence?.events || []).map((event) => ({
    ...event,
    scheduledTime: safeStart + Math.max(0, Number(event.time) || 0),
  }));
}

export async function playSequence(sequence) {
  const context = getContext();
  if (context.state === "suspended") await context.resume();
  const start = context.currentTime + 0.02;
  const frequencies = { kick: 90, snare: 180, clap: 260, hihat: 5200, percussion: 880, bass: 65 };
  planSequenceEvents(sequence, start).forEach(({ instrument, scheduledTime: at, velocity }) => {
    const duration = instrument === "kick" || instrument === "bass" ? 0.22 : instrument === "hihat" ? 0.045 : 0.1;
    const level = Math.max(0.001, velocity * (instrument === "hihat" ? 0.035 : instrument === "kick" ? 0.16 : 0.09));
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    if (["snare", "clap", "hihat"].includes(instrument)) {
      const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < data.length; index += 1) { const seed = Math.sin((index + 1) * 12.9898 + instrument.length * 78.233) * 43758.5453; data[index] = (seed - Math.floor(seed)) * 2 - 1; }
      const noise = context.createBufferSource();
      const filter = context.createBiquadFilter();
      filter.type = instrument === "hihat" ? "highpass" : "bandpass";
      filter.frequency.setValueAtTime(instrument === "hihat" ? 4200 : 1800, at);
      filter.Q.setValueAtTime(0.7, at);
      noise.buffer = buffer;
      noise.connect(filter).connect(gain).connect(context.destination);
      noise.start(at);
      noise.stop(at + duration + 0.02);
    } else {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(instrument === "kick" ? 130 : frequencies[instrument] || 300, at);
      if (instrument === "kick") oscillator.frequency.exponentialRampToValueAtTime(55, at + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(at);
      oscillator.stop(at + duration + 0.03);
    }
  });
  return { steps: sequence.events.length, duration: sequence.duration };
}

export async function playPattern(name, { bpm = 100, bars = 1 } = {}) {
  return playSequence(createBeatEvents({ pattern: name, bpm, bars }));
}
