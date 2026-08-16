import { normalizeProject } from "./studio/project-model.js";

const DB_NAME = "fernando-lucoco-music";
const DB_VERSION = 4;
const DEFAULT_STORAGE_KEY = "fernando-lucoco-music-projects";
const STORES = {
  projects: "projects",
  takes: "takes",
  blobs: "blobs",
  metadata: "metadata",
  effects: "effects",
  beats: "beats",
  pitchEdits: "pitchEdits",
};

function isSupported() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDatabase() {
  if (!isSupported()) return Promise.reject(new Error("IndexedDB indisponível"));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORES.projects)) database.createObjectStore(STORES.projects, { keyPath: "id" });
      if (!database.objectStoreNames.contains(STORES.takes)) database.createObjectStore(STORES.takes, { keyPath: "id" });
      if (!database.objectStoreNames.contains(STORES.blobs)) database.createObjectStore(STORES.blobs, { keyPath: "key" });
      if (!database.objectStoreNames.contains(STORES.metadata)) database.createObjectStore(STORES.metadata, { keyPath: "key" });
      if (!database.objectStoreNames.contains(STORES.effects)) database.createObjectStore(STORES.effects, { keyPath: "id" });
      if (!database.objectStoreNames.contains(STORES.beats)) database.createObjectStore(STORES.beats, { keyPath: "key" });
      if (!database.objectStoreNames.contains(STORES.pitchEdits)) database.createObjectStore(STORES.pitchEdits, { keyPath: "key" });
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () => reject(request.error || new Error("Não foi possível abrir IndexedDB"));
    request.onblocked = () => reject(new Error("IndexedDB está bloqueado por outra sessão"));
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Operação IndexedDB falhou"));
  });
}

async function withStore(storeName, mode, operation) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(storeName, mode);
    const result = await operation(transaction.objectStore(storeName), transaction);
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Transacção IndexedDB falhou"));
      transaction.onabort = () => reject(transaction.error || new Error("Transacção IndexedDB foi abortada"));
    });
    return result;
  } finally {
    database.close();
  }
}

export async function indexedDbAvailable() {
  if (!isSupported()) return false;
  try {
    const database = await openDatabase();
    database.close();
    return true;
  } catch {
    return false;
  }
}

export async function putProject(project) {
  const normalized = normalizeProject(project);
  return withStore(STORES.projects, "readwrite", (store) => requestToPromise(store.put(normalized)));
}

export async function getProject(id) {
  return withStore(STORES.projects, "readonly", (store) => requestToPromise(store.get(id)));
}

export async function putTake(take) {
  return withStore(STORES.takes, "readwrite", (store) => requestToPromise(store.put(take)));
}

export async function getTake(id) {
  return withStore(STORES.takes, "readonly", (store) => requestToPromise(store.get(id)));
}

export async function putEffect(effect) {
  return withStore(STORES.effects, "readwrite", (store) => requestToPromise(store.put(effect)));
}

export async function getMetadata(key) {
  const record = await withStore(STORES.metadata, "readonly", (store) => requestToPromise(store.get(key)));
  return record?.value ?? null;
}

export async function putMetadata(key, value) {
  return withStore(STORES.metadata, "readwrite", (store) => requestToPromise(store.put({ key, value })));
}

export async function putAudioBlob(projectId, kind, blob) {
  const key = `${projectId}:${kind}`;
  return withStore(STORES.blobs, "readwrite", (store) => requestToPromise(store.put({ key, projectId, kind, blob, bytes: blob?.size || 0 })));
}

export async function getAudioBlob(projectId, kind) {
  const record = await withStore(STORES.blobs, "readonly", (store) => requestToPromise(store.get(`${projectId}:${kind}`)));
  return record?.blob || null;
}

export async function deleteAudioBlob(projectId, kind) {
  return withStore(STORES.blobs, "readwrite", (store) => requestToPromise(store.delete(`${projectId}:${kind}`)));
}

export async function putBeatBlob(projectId, beatId, blob, metadata = {}) {
  const key = `${projectId}:${beatId}`;
  return withStore(STORES.beats, "readwrite", (store) => requestToPromise(store.put({ key, projectId, beatId, blob, bytes: blob?.size || 0, mimeType: blob?.type || metadata.type || "audio/octet-stream", name: metadata.name || "beat-importado", updatedAt: new Date().toISOString() })));
}

export async function getBeatBlob(projectId, beatId) {
  const record = await withStore(STORES.beats, "readonly", (store) => requestToPromise(store.get(`${projectId}:${beatId}`)));
  return record || null;
}

export async function deleteBeatBlob(projectId, beatId) {
  return withStore(STORES.beats, "readwrite", (store) => requestToPromise(store.delete(`${projectId}:${beatId}`)));
}

export async function putPitchEdits(projectId, notes, metadata = {}) {
  const key = `${projectId}:pitch-edits`;
  return withStore(STORES.pitchEdits, "readwrite", (store) => requestToPromise(store.put({ key, projectId, notes: Array.isArray(notes) ? notes : [], root: metadata.root || "C", scale: metadata.scale || "major", updatedAt: new Date().toISOString() })));
}

export async function getPitchEdits(projectId) {
  const record = await withStore(STORES.pitchEdits, "readonly", (store) => requestToPromise(store.get(`${projectId}:pitch-edits`)));
  return record || null;
}

export async function deletePitchEdits(projectId) {
  return withStore(STORES.pitchEdits, "readwrite", (store) => requestToPromise(store.delete(`${projectId}:pitch-edits`)));
}

export async function deleteEffect(projectId, suffix = "spatial") {
  return withStore(STORES.effects, "readwrite", (store) => requestToPromise(store.delete(`${projectId}:${suffix}`)));
}

export async function resetProjectEffects(projectId) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([STORES.projects, STORES.blobs, STORES.effects, STORES.beats, STORES.pitchEdits], "readwrite");
    for (const kind of ["processed", "enhanced", "pitch-corrected", "mixed", "spatial"]) transaction.objectStore(STORES.blobs).delete(`${projectId}:${kind}`);
    const beats = transaction.objectStore(STORES.beats);
    const beatRequest = beats.openCursor();
    beatRequest.onsuccess = () => {
      const cursor = beatRequest.result;
      if (!cursor) return;
      if (cursor.value.projectId === projectId) cursor.delete();
      cursor.continue();
    };
    transaction.objectStore(STORES.pitchEdits).delete(`${projectId}:pitch-edits`);
    const projectStore = transaction.objectStore(STORES.projects);
    const projectRequest = projectStore.get(projectId);
    projectRequest.onsuccess = () => {
      const project = projectRequest.result;
      if (!project) return;
      projectStore.put({ ...project, processedAudioData: false, processedMimeType: null, processedBytes: 0, effects: [], audioVariants: {} });
    };
    const effects = transaction.objectStore(STORES.effects);
    const effectRequest = effects.openCursor();
    effectRequest.onsuccess = () => {
      const cursor = effectRequest.result;
      if (!cursor) return;
      if (cursor.value.projectId === projectId) cursor.delete();
      cursor.continue();
    };
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Não foi possível repor os efeitos"));
      transaction.onabort = () => reject(transaction.error || new Error("Reset de efeitos foi abortado"));
    });
  } finally {
    database.close();
  }
}

export async function deleteProjectData(projectId) {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(Object.values(STORES), "readwrite");
    transaction.objectStore(STORES.projects).delete(projectId);
    transaction.objectStore(STORES.takes).delete(projectId);
    transaction.objectStore(STORES.blobs).delete(`${projectId}:original`);
    for (const kind of ["processed", "enhanced", "pitch-corrected", "mixed", "spatial"]) transaction.objectStore(STORES.blobs).delete(`${projectId}:${kind}`);
    transaction.objectStore(STORES.pitchEdits).delete(`${projectId}:pitch-edits`);
    const beats = transaction.objectStore(STORES.beats);
    const beatRequest = beats.openCursor();
    beatRequest.onsuccess = () => {
      const cursor = beatRequest.result;
      if (!cursor) return;
      if (cursor.value.projectId === projectId) cursor.delete();
      cursor.continue();
    };
    const effects = transaction.objectStore(STORES.effects);
    const effectRequest = effects.openCursor();
    effectRequest.onsuccess = () => {
      const cursor = effectRequest.result;
      if (!cursor) return;
      if (cursor.value.projectId === projectId) cursor.delete();
      cursor.continue();
    };
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error("Não foi possível remover a sessão"));
      transaction.onabort = () => reject(transaction.error || new Error("Remoção da sessão foi abortada"));
    });
  } finally {
    database.close();
  }
}

export async function clearIndexedDb() {
  if (!isSupported()) return false;
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error || new Error("Não foi possível limpar IndexedDB"));
    request.onblocked = () => reject(new Error("IndexedDB está bloqueado por uma sessão aberta"));
  });
  return true;
}

export async function clearLocalStudioData(storageKey = DEFAULT_STORAGE_KEY) {
  localStorage.removeItem(storageKey);
  try {
    await clearIndexedDb();
  } catch {
    // O metadata local já foi removido; manter a aplicação utilizável se a base estiver bloqueada.
  }
  return true;
}

async function dataUrlToBlob(value) {
  if (!value || typeof value !== "string") return null;
  try {
    return await (await fetch(value)).blob();
  } catch {
    return null;
  }
}

export async function migrateLocalStorageProjects(storageKey = DEFAULT_STORAGE_KEY) {
  if (!isSupported()) return { migrated: false, reason: "indexeddb-unavailable", count: 0, failed: 0 };
  let projects;
  try {
    projects = JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return { migrated: false, reason: "invalid-local-data", count: 0, failed: 0 };
  }
  if (!Array.isArray(projects) || projects.length === 0) return { migrated: false, reason: "nothing-to-migrate", count: 0, failed: 0 };

  let migrated = 0;
  let failed = 0;
  for (const project of projects) {
    try {
      const migratedAt = new Date().toISOString();
      await putProject({ ...project, migratedAt, storageVersion: "indexeddb-v2" });
      await putTake({
        id: project.id,
        projectId: project.id,
        originalAudioData: Boolean(project.originalAudioData || project.audioData),
        processedAudioData: Boolean(project.processedAudioData),
        migratedAt,
      });
      const original = await dataUrlToBlob(project.originalAudioData || (!project.processedAudioData ? project.audioData : ""));
      const processed = await dataUrlToBlob(project.processedAudioData || ((project.effectApplied || project.fadeApplied) ? project.audioData : ""));
      if (original) await putAudioBlob(project.id, "original", original);
      if (processed) await putAudioBlob(project.id, "processed", processed);
      migrated += 1;
    } catch {
      failed += 1;
    }
  }
  await putMetadata("lastMigration", { storageKey, count: migrated, failed, at: new Date().toISOString() });
  return { migrated: migrated > 0, reason: failed ? "partial" : "completed", count: migrated, failed };
}

export async function getStorageHealth(storageKey = DEFAULT_STORAGE_KEY) {
  let localStorageWritable = false;
  try {
    const probeKey = `${storageKey}:probe`;
    localStorage.setItem(probeKey, "1");
    localStorage.removeItem(probeKey);
    localStorageWritable = true;
  } catch {
    localStorageWritable = false;
  }
  const indexedDb = await indexedDbAvailable();
  const usage = await estimateStorageUsage(storageKey);
  const quotaRemaining = usage.quota == null || usage.usage == null
    ? null
    : Math.max(usage.quota - usage.usage, 0);
  return {
    ...usage,
    localStorageWritable,
    indexedDbAvailable: indexedDb,
    quotaRemaining,
    mode: indexedDb && localStorageWritable ? "dual-write" : localStorageWritable ? "localStorage-fallback" : "unavailable",
    privateMode: "unknown",
  };
}

export async function estimateStorageUsage(storageKey = DEFAULT_STORAGE_KEY) {
  let localBytes = 0;
  try {
    localBytes = new Blob([localStorage.getItem(storageKey) || ""]).size;
  } catch {
    localBytes = 0;
  }
  let estimate = null;
  try {
    estimate = await navigator.storage?.estimate?.();
  } catch {
    estimate = null;
  }
  return {
    localBytes,
    usage: estimate?.usage ?? null,
    quota: estimate?.quota ?? null,
    indexedDbAvailable: await indexedDbAvailable(),
  };
}

export const STORAGE_POLICY = {
  status: "internal-beta",
  primaryRead: "localStorage",
  dualWrite: true,
  promotionCriteria: [
    "reload-reopen-recovery-real-browser",
    "quota-and-private-mode-real-browser",
    "original-processed-reset-real-browser",
    "android-chrome-and-ios-safari-recording",
  ],
};

export const INDEXED_DB_SCHEMA = {
  database: DB_NAME,
  version: DB_VERSION,
  stores: Object.values(STORES),
  dedicatedBeatStore: STORES.beats,
  dedicatedPitchEditStore: STORES.pitchEdits,
  strategy: "dual-write-progressive-migration-with-localStorage-fallback",
};

export const STORAGE_KEY = DEFAULT_STORAGE_KEY;
