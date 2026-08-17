export const SOUND_LIBRARY = [
  { id: "drums-afrobeat", name: "Drums · Afrobeat", type: "drums", duration: 4, color: "#f4b860", preview: { kind: "pattern", value: "Afrobeat" }, metadata: { instrument: "drums", pattern: "Afrobeat", origin: "sound-library" } },
  { id: "drums-amapiano", name: "Drums · Amapiano", type: "drums", duration: 4, color: "#f4b860", preview: { kind: "pattern", value: "Amapiano" }, metadata: { instrument: "drums", pattern: "Amapiano", origin: "sound-library" } },
  { id: "bass-c4", name: "Bass · C", type: "bass", duration: 2, color: "#62d6c7", preview: { kind: "note", value: "C2" }, metadata: { instrument: "bass", note: "C2", origin: "sound-library" } },
  { id: "guitar-am", name: "Guitarra · Am", type: "guitar", duration: 4, color: "#9c8cff", preview: { kind: "chord", value: "Am" }, metadata: { instrument: "guitar", chord: "Am", origin: "sound-library" } },
  { id: "piano-c", name: "Piano · C", type: "piano", duration: 4, color: "#8fb8ff", preview: { kind: "chord", value: "C" }, metadata: { instrument: "piano", chord: "C", origin: "sound-library" } },
  { id: "strings-c", name: "Cordas · C", type: "strings", duration: 4, color: "#d89cff", preview: { kind: "chord", value: "C" }, metadata: { instrument: "strings", chord: "C", origin: "sound-library" } },
  { id: "synth-am", name: "Synth Pad · Am", type: "synth", duration: 4, color: "#ff91c8", preview: { kind: "chord", value: "Am" }, metadata: { instrument: "synth", chord: "Am", origin: "sound-library" } },
];

export function getSoundLibraryItem(id) {
  return SOUND_LIBRARY.find((item) => item.id === id) || null;
}

export function soundLibraryClip(item, start = 0) {
  if (!item) return null;
  return {
    id: `sound-library-${item.id}-${Date.now()}`,
    name: item.name,
    start: Math.max(0, Number(start) || 0),
    duration: item.duration,
    sourceOffset: 0,
    mimeType: "application/x-fernando-lucoco-event",
    event: { ...item.metadata, soundId: item.id },
    gain: 1,
  };
}
