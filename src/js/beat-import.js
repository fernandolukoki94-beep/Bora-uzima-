export const MAX_BEAT_BYTES = 80 * 1024 * 1024;
const AUDIO_TYPES = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/flac",
]);

export function validateBeatFile(file) {
  if (!file || typeof file !== "object") throw new Error("Selecciona um ficheiro de áudio.");
  const extension = String(file.name || "").toLowerCase().split(".").pop();
  const supportedExtension = ["wav", "mp3", "ogg", "webm", "m4a", "aac", "flac"].includes(extension);
  if (!AUDIO_TYPES.has(file.type) && !supportedExtension) throw new Error("Formato não suportado. Usa WAV, MP3, OGG, WebM, M4A, AAC ou FLAC.");
  if (Number(file.size) > MAX_BEAT_BYTES) throw new Error("O beat excede o limite local de 80 MB.");
  return true;
}

export function createImportedBeat(file, url = URL.createObjectURL(file)) {
  validateBeatFile(file);
  return {
    id: `beat-${Date.now()}`,
    name: String(file.name || "beat-importado"),
    type: String(file.type || "audio/octet-stream"),
    size: Number(file.size || 0),
    url,
    source: "device",
    importedAt: new Date().toISOString(),
  };
}

export function revokeImportedBeat(beat) {
  if (beat?.url?.startsWith?.("blob:")) URL.revokeObjectURL(beat.url);
}
