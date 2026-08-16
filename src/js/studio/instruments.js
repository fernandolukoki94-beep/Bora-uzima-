const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const CHORDS = {
  C: ["C4", "E4", "G4"],
  Am: ["A3", "C4", "E4"],
  F: ["F3", "A3", "C4"],
  G: ["G3", "B3", "D4"],
};

export const DRUM_PATTERNS = {
  Afrobeat: { steps: 16, kick: [0, 4, 8, 12], snare: [4, 12], clap: [4, 12], hihat: [2, 6, 10, 14], percussion: [3, 7, 11, 15] },
  Amapiano: { steps: 16, kick: [0, 6, 8, 14], snare: [4, 12], clap: [4, 12], hihat: [2, 6, 10, 14], percussion: [3, 7, 11, 15] },
  Kuduro: { steps: 16, kick: [0, 3, 6, 8, 11, 14], snare: [4, 12], clap: [4, 12], hihat: [1, 3, 5, 7, 9, 11, 13, 15], percussion: [2, 6, 10, 14] },
  "Afro House": { steps: 16, kick: [0, 4, 8, 12], snare: [4, 12], clap: [4, 12], hihat: [2, 6, 10, 14], percussion: [1, 5, 9, 13] },
  Rumba: { steps: 16, kick: [0, 8], snare: [4, 12], clap: [4, 12], hihat: [2, 6, 10, 14], percussion: [3, 7, 11, 15] },
};

export function noteToMidi(note) {
  const match = /^([A-G])(#?)(-?\d+)$/.exec(String(note));
  if (!match) throw new Error(`Nota inválida: ${note}`);
  const name = `${match[1]}${match[2]}`;
  const octave = Number(match[3]);
  const index = NOTE_NAMES.indexOf(name);
  if (index < 0) throw new Error(`Nota inválida: ${note}`);
  return (octave + 1) * 12 + index;
}

export function midiToFrequency(midi) {
  return 440 * 2 ** ((Number(midi) - 69) / 12);
}

export function noteToFrequency(note) {
  return midiToFrequency(noteToMidi(note));
}

export function createNote({ pitch = 60, start = 0, duration = 0.25, velocity = 0.8 } = {}) {
  return {
    id: `note-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    pitch: Math.max(0, Math.min(127, Math.round(pitch))),
    start: Math.max(0, Number(start) || 0),
    duration: Math.max(0.01, Number(duration) || 0.25),
    velocity: Math.max(0, Math.min(1, Number(velocity) || 0)),
  };
}

export function quantizeNote(note, grid = 0.25) {
  const safeGrid = Math.max(0.001, Number(grid) || 0.25);
  return { ...note, start: Math.max(0, Math.round(note.start / safeGrid) * safeGrid) };
}

export function createPatternSequence(pattern, bars = 1) {
  const safePattern = DRUM_PATTERNS[pattern] || DRUM_PATTERNS.Afrobeat;
  const result = [];
  const hitsPerBar = safePattern.steps;
  for (let bar = 0; bar < Math.max(1, Math.floor(bars)); bar += 1) {
    for (const [instrument, steps] of Object.entries(safePattern)) {
      if (instrument === "steps") continue;
      for (const step of steps) result.push({ instrument, start: bar * hitsPerBar + step, velocity: 0.8 });
    }
  }
  return result.sort((a, b) => a.start - b.start);
}

export const BEAT_PRESETS = {
  Afrobeat: { bpm: 104, pattern: "Afrobeat" },
  Amapiano: { bpm: 112, pattern: "Amapiano" },
  Kuduro: { bpm: 128, pattern: "Kuduro" },
  "Afro House": { bpm: 122, pattern: "Afro House" },
  Rumba: { bpm: 96, pattern: "Rumba" },
};

export function getBeatPreset(name = "Afrobeat") {
  const preset = BEAT_PRESETS[name] || BEAT_PRESETS.Afrobeat;
  const pattern = DRUM_PATTERNS[preset.pattern];
  return {
    name: preset.pattern,
    bpm: preset.bpm,
    steps: pattern.steps,
    channels: {
      kick: [...pattern.kick],
      snare: [...pattern.snare],
      clap: [...pattern.clap],
      hihat: [...pattern.hihat],
      percussion: [...pattern.percussion],
      bass: [...pattern.kick.filter((step) => step % 4 === 0)],
    },
  };
}
