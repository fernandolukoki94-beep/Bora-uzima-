const BASE_SOUNDS = [
  { id: "drums-afrobeat", name: "Drums · Afrobeat", type: "drums", category: "Drums", genre: "Afrobeat", bpm: 104, key: "C", mood: "Dance", duration: 4, color: "#f4b860", preview: { kind: "pattern", value: "Afrobeat" }, metadata: { instrument: "drums", pattern: "Afrobeat", origin: "sound-library" } },
  { id: "drums-amapiano", name: "Drums · Amapiano", type: "drums", category: "Drums", genre: "Amapiano", bpm: 112, key: "Am", mood: "Dance", duration: 4, color: "#f4b860", preview: { kind: "pattern", value: "Amapiano" }, metadata: { instrument: "drums", pattern: "Amapiano", origin: "sound-library" } },
  { id: "bass-c4", name: "Bass · C", type: "bass", category: "Bass", genre: "Afrobeat", bpm: 104, key: "C", mood: "Warm", duration: 2, color: "#62d6c7", preview: { kind: "note", value: "C2" }, metadata: { instrument: "bass", note: "C2", origin: "sound-library" } },
  { id: "guitar-am", name: "Guitarra · Am", type: "guitar", category: "Guitar", genre: "Afrobeat", bpm: 104, key: "Am", mood: "Warm", duration: 4, color: "#9c8cff", preview: { kind: "chord", value: "Am" }, metadata: { instrument: "guitar", chord: "Am", origin: "sound-library" } },
  { id: "piano-c", name: "Piano · C", type: "piano", category: "Keys", genre: "R&B", bpm: 88, key: "C", mood: "Calm", duration: 4, color: "#8fb8ff", preview: { kind: "chord", value: "C" }, metadata: { instrument: "piano", chord: "C", origin: "sound-library" } },
  { id: "strings-c", name: "Cordas · C", type: "strings", category: "Melody", genre: "Pop", bpm: 96, key: "C", mood: "Cinematic", duration: 4, color: "#d89cff", preview: { kind: "chord", value: "C" }, metadata: { instrument: "strings", chord: "C", origin: "sound-library" } },
  { id: "synth-am", name: "Synth Pad · Am", type: "synth", category: "Keys", genre: "Amapiano", bpm: 112, key: "Am", mood: "Dark", duration: 4, color: "#ff91c8", preview: { kind: "chord", value: "Am" }, metadata: { instrument: "synth", chord: "Am", origin: "sound-library" } },
];

export const SOUND_LIBRARY = Object.freeze(BASE_SOUNDS.map((item) => Object.freeze({ ...item, metadata: Object.freeze({ ...item.metadata }) })));

export function getSoundLibraryItem(id) {
  return SOUND_LIBRARY.find((item) => item.id === id) || null;
}

export function filterSoundLibrary(items = SOUND_LIBRARY, filters = {}) {
  const query = String(filters.query || "").trim().toLowerCase();
  const category = String(filters.category || "").trim().toLowerCase();
  const genre = String(filters.genre || "").trim().toLowerCase();
  const key = String(filters.key || "").trim().toLowerCase();
  const mood = String(filters.mood || "").trim().toLowerCase();
  const bpm = Number(filters.bpm);
  const favoriteIds = new Set(Array.isArray(filters.favoriteIds) ? filters.favoriteIds : []);
  return items.filter((item) => {
    const haystack = [item.name, item.category, item.genre, item.type, item.mood].join(" ").toLowerCase();
    if (query && !haystack.includes(query)) return false;
    if (category && item.category.toLowerCase() !== category) return false;
    if (genre && item.genre.toLowerCase() !== genre) return false;
    if (key && item.key.toLowerCase() !== key) return false;
    if (mood && item.mood.toLowerCase() !== mood) return false;
    if (Number.isFinite(bpm) && bpm > 0 && Math.abs(item.bpm - bpm) > 12) return false;
    if (filters.favoritesOnly && !favoriteIds.has(item.id)) return false;
    return true;
  });
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
