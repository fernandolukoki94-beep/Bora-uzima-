import { CHORDS, createPatternSequence, noteToFrequency } from "./instruments.js";

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

export async function playPattern(name, { bpm = 100, bars = 1 } = {}) {
  const context = getContext();
  if (context.state === "suspended") await context.resume();
  const sequence = createPatternSequence(name, bars);
  const secondsPerStep = 60 / Math.max(40, Math.min(240, bpm)) / 4;
  const start = context.currentTime + 0.02;
  sequence.forEach(({ instrument, start: step, velocity }) => {
    const at = start + step * secondsPerStep;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequencies = { kick: 90, snare: 180, clap: 260, hihat: 5200, percussion: 880 };
    oscillator.type = instrument === "kick" ? "sine" : "square";
    oscillator.frequency.setValueAtTime(frequencies[instrument] || 300, at);
    gain.gain.setValueAtTime(Math.max(0.001, velocity * (instrument === "hihat" ? 0.045 : 0.12)), at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + (instrument === "kick" ? 0.18 : 0.07));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.2);
  });
  return { steps: sequence.length, duration: (bars * 16) * secondsPerStep };
}
