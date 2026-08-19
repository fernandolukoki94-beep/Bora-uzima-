const DB_NAME = "fernando-lucoco-my-sounds";
const DB_VERSION = 1;
const STORE = "sounds";
const MAX_BYTES = 80 * 1024 * 1024;

export function validateMySoundFile(file) {
  if (!file || typeof file !== "object") return { ok: false, error: "Selecciona um ficheiro de áudio." };
  if (!file.type?.startsWith("audio/")) return { ok: false, error: "O ficheiro deve ser áudio." };
  if (Number(file.size) > MAX_BYTES) return { ok: false, error: "O ficheiro excede o limite local de 80 MB." };
  return { ok: true, error: "" };
}

export function normalizeMySoundMetadata(input = {}) {
  return {
    id: String(input.id || `my-sound-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    name: String(input.name || "Som sem nome").trim().slice(0, 120) || "Som sem nome",
    folder: String(input.folder || "Raiz").trim().slice(0, 60) || "Raiz",
    tags: [...new Set(String(input.tags || "").split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 12),
    favorite: Boolean(input.favorite),
    mimeType: String(input.mimeType || "audio/*"),
    size: Math.max(0, Number(input.size) || 0),
    duration: Math.max(0, Number(input.duration) || 0),
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function filterMySounds(items = [], filters = {}) {
  const query = String(filters.query || "").trim().toLowerCase();
  const folder = String(filters.folder || "").trim().toLowerCase();
  const favoritesOnly = Boolean(filters.favoritesOnly);
  return items.filter((item) => {
    const haystack = [item.name, item.folder, ...(Array.isArray(item.tags) ? item.tags : [])].join(" ").toLowerCase();
    if (query && !haystack.includes(query)) return false;
    if (folder && String(item.folder).toLowerCase() !== folder) return false;
    if (favoritesOnly && !item.favorite) return false;
    return true;
  });
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error("IndexedDB não está disponível neste navegador."));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Não foi possível abrir My Sounds."));
  });
}

export async function listMySounds() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => { db.close(); resolve(request.result.map(({ blob, ...metadata }) => metadata).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function putMySound(file, metadata = {}) {
  const validation = validateMySoundFile(file);
  if (!validation.ok) throw new Error(validation.error);
  const record = normalizeMySoundMetadata({ ...metadata, name: metadata.name || file.name.replace(/\.[^.]+$/, ""), mimeType: file.type, size: file.size, blob: file });
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).put({ ...record, blob: file });
    request.onsuccess = () => { db.close(); resolve(record); };
    request.onerror = () => { db.close(); reject(request.error || new Error("Não foi possível guardar o som.")); };
  });
}

export async function updateMySound(id, patch = {}) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const store = db.transaction(STORE, "readwrite").objectStore(STORE);
    const read = store.get(id);
    read.onsuccess = () => {
      if (!read.result) { db.close(); reject(new Error("Som não encontrado.")); return; }
      const next = normalizeMySoundMetadata({ ...read.result, ...patch, id });
      const request = store.put({ ...read.result, ...next });
      request.onsuccess = () => { db.close(); resolve(next); };
      request.onerror = () => { db.close(); reject(request.error); };
    };
    read.onerror = () => { db.close(); reject(read.error); };
  });
}

export async function deleteMySound(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
    request.onsuccess = () => { db.close(); resolve(true); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function getMySoundBlob(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
    request.onsuccess = () => { db.close(); resolve(request.result?.blob || null); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export const MY_SOUNDS_MAX_BYTES = MAX_BYTES;
