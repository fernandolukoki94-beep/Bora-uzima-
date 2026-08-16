export const STORAGE_KEY = "fernando-lucoco-music-projects";

export function readProjects() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveProjects(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Convert a persisted data URL to Blob without relying on fetch(data:...). */
export async function dataUrlToBlob(value) {
  if (value instanceof Blob) return value;
  if (typeof value !== "string" || !value) throw new Error("Áudio local inválido");
  const separator = value.indexOf(",");
  if (separator < 0) throw new Error("Data URL de áudio inválido");
  const header = value.slice(0, separator);
  const body = value.slice(separator + 1);
  const mimeMatch = header.match(/^data:([^;]+)(;base64)?$/i);
  if (!mimeMatch) throw new Error("Formato de áudio local não suportado");
  const mimeType = mimeMatch[1] || "application/octet-stream";
  if (mimeMatch[2]) {
    const binary = atob(body);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new Blob([bytes], { type: mimeType });
  }
  return new Blob([decodeURIComponent(body)], { type: mimeType });
}

export function getFileExtension(mimeType = "") {
  const normalized = String(mimeType).toLowerCase();
  if (normalized.includes("wav")) return "wav";
  if (normalized.includes("mp4")) return "m4a";
  if (normalized.includes("ogg")) return "ogg";
  return "webm";
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char]);
}

export function makeProjectId() {
  return crypto.randomUUID?.() || String(Date.now());
}
