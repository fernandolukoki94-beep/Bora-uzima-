import { CHORDS, noteToFrequency } from "./instruments.js";
import { createBeatEvents } from "./sequencer.js";

function getContext() {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) throw new Error("Web Audio API indisponível");
  if (!getContext.instance) getContext.instance = new Context();
  return getContext.instance;
}

export async function playNote(note, { duration = 0.35, type = "triangle", volume = 0.16, instrument = "piano" } = {}) {
  const context = getContext();
  if (context.state === "suspended") await context.resume();
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const start = context.currentTime;
  const safeDuration = Math.max(0.08, duration);
  const frequency = noteToFrequency(note);
  const timbre = ["piano", "guitar", "strings", "synth"].includes(instrument) ? instrument : "piano";
  oscillator.type = timbre === "synth" ? "sawtooth" : type;
  oscillator.frequency.setValueAtTime(frequency, start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(timbre === "strings" ? 3200 : timbre === "synth" ? 2400 : type === "square" ? 4200 : 5600, start);
  filter.Q.setValueAtTime(timbre === "synth" ? 0.7 : 0.35, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + Math.min(0.035, safeDuration * 0.18));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + safeDuration);
  oscillator.connect(filter).connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + safeDuration + 0.04);
  if (timbre !== "synth") {
    const harmonic = context.createOscillator();
    const harmonicGain = context.createGain();
    harmonic.type = timbre === "strings" ? "sawtooth" : "triangle";
    harmonic.frequency.setValueAtTime(frequency * (timbre === "guitar" ? 2 : 3), start);
    harmonicGain.gain.setValueAtTime(0.0001, start);
    harmonicGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * (timbre === "strings" ? 0.16 : 0.2)), start + 0.03);
    harmonicGain.gain.exponentialRampToValueAtTime(0.0001, start + safeDuration * 0.78);
    harmonic.connect(filter).connect(harmonicGain).connect(context.destination);
    harmonic.start(start);
    harmonic.stop(start + safeDuration + 0.04);
  }
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

function scheduleDrumHit(context, instrument, at, velocity = 0.8) {
  const safeInstrument = ["kick", "snare", "clap", "hihat", "percussion", "bass"].includes(instrument) ? instrument : "kick";
  const duration = safeInstrument === "kick" || safeInstrument === "bass" ? 0.22 : safeInstrument === "hihat" ? 0.045 : 0.1;
  const level = Math.max(0.001, Math.min(1, Number(velocity) || 0) * (safeInstrument === "hihat" ? 0.075 : safeInstrument === "kick" ? 0.56 : safeInstrument === "bass" ? 0.3 : 0.2));
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(level, at + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  if (["snare", "clap", "hihat", "percussion"].includes(safeInstrument)) {
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      const seed = Math.sin((index + 1) * 12.9898 + safeInstrument.length * 78.233) * 43758.5453;
      data[index] = (seed - Math.floor(seed)) * 2 - 1;
    }
    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    filter.type = safeInstrument === "hihat" ? "highpass" : "bandpass";
    filter.frequency.setValueAtTime(safeInstrument === "hihat" ? 4200 : safeInstrument === "percussion" ? 900 : 1800, at);
    filter.Q.setValueAtTime(0.7, at);
    noise.buffer = buffer;
    noise.connect(filter).connect(gain).connect(context.destination);
    noise.start(at);
    noise.stop(at + duration + 0.02);
    return;
  }
  const oscillator = context.createOscillator();
  const isKick = safeInstrument === "kick";
  const isBass = safeInstrument === "bass";
  oscillator.type = isBass ? "triangle" : "sine";
  oscillator.frequency.setValueAtTime(isKick ? 155 : 65, at);
  oscillator.frequency.exponentialRampToValueAtTime(isKick ? 48 : 52, at + duration * (isKick ? 0.72 : 1));
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.03);
  if (isBass) {
    // O fundamental abaixo de 60 Hz pode desaparecer em altifalantes de telemóvel.
    // Mantemos o sub grave, mas acrescentamos corpo e presença audível no médio-grave.
    const harmonics = [
      { frequency: 130, endFrequency: 104, type: "triangle", level: 0.2 },
      { frequency: 195, endFrequency: 156, type: "sine", level: 0.11 },
    ];
    harmonics.forEach(({ frequency, endFrequency, type, level }) => {
      const harmonic = context.createOscillator();
      const harmonicGain = context.createGain();
      harmonic.type = type;
      harmonic.frequency.setValueAtTime(frequency, at);
      harmonic.frequency.exponentialRampToValueAtTime(endFrequency, at + duration);
      harmonicGain.gain.setValueAtTime(0.0001, at);
      harmonicGain.gain.exponentialRampToValueAtTime(level, at + 0.006);
      harmonicGain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      harmonic.connect(harmonicGain).connect(context.destination);
      harmonic.start(at);
      harmonic.stop(at + duration + 0.03);
    });
  }
}

export async function playDrumHit(instrument = "kick", { velocity = 0.8 } = {}) {
  const context = getContext();
  if (context.state === "suspended") await context.resume();
  scheduleDrumHit(context, instrument, context.currentTime + 0.01, velocity);
  return { instrument, duration: instrument === "kick" || instrument === "bass" ? 0.22 : 0.1 };
}

export async function playSequence(sequence) {
  const context = getContext();
  if (context.state === "suspended") await context.resume();
  const start = context.currentTime + 0.02;
  planSequenceEvents(sequence, start).forEach(({ instrument, scheduledTime: at, velocity }) => scheduleDrumHit(context, instrument, at, velocity));
  return { steps: sequence.events.length, duration: sequence.duration };
}

export async function playPattern(name, { bpm = 100, bars = 1 } = {}) {
  return playSequence(createBeatEvents({ pattern: name, bpm, bars }));
}
