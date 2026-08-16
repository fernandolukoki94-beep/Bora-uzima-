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
  const gain = context.createGain();
  const start = context.currentTime;
  oscillator.type = type;
  oscillator.frequency.value = noteToFrequency(note);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
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
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = instrument === "kick" || instrument === "bass" ? "sine" : "square";
    oscillator.frequency.setValueAtTime(frequencies[instrument] || 300, at);
    const duration = instrument === "kick" || instrument === "bass" ? 0.18 : 0.07;
    gain.gain.setValueAtTime(Math.max(0.001, velocity * (instrument === "hihat" ? 0.045 : 0.12)), at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.2);
  });
  return { steps: sequence.events.length, duration: sequence.duration };
}

export async function playPattern(name, { bpm = 100, bars = 1 } = {}) {
  return playSequence(createBeatEvents({ pattern: name, bpm, bars }));
}
