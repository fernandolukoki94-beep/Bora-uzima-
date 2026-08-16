const DB_NAME = "fernando-lucoco-music";
const DB_VERSION = 2;
const STORES = {
  projects: "projects",
  takes: "takes",
  blobs: "blobs",
  metadata: "metadata",
  effects: "effects",
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
      if (!database.objectStoreNames.contains(STORES.projects)) {
        database.createObjectStore(STORES.projects, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(STORES.takes)) {
        database.createObjectStore(STORES.takes, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(STORES.blobs)) {
        database.createObjectStore(STORES.blobs, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains(STORES.metadata)) {
        database.createObjectStore(STORES.metadata, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains(STORES.effects)) {
        database.createObjectStore(STORES.effects, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Não foi possível abrir IndexedDB"));
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Operação IndexedDB falhou"));
  });
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
  const database = await openDatabase();
  try {
    await requestToPromise(database.transaction(STORES.projects, "readwrite").objectStore(STORES.projects).put(project));
    return true;
  } finally {
    database.close();
  }
}

export async function putTake(take) {
  const database = await openDatabase();
  try {
    await requestToPromise(database.transaction(STORES.takes, "readwrite").objectStore(STORES.takes).put(take));
    return true;
  } finally {
    database.close();
  }
}

export async function putEffect(effect) {
  const database = await openDatabase();
  try {
    await requestToPromise(database.transaction(STORES.effects, "readwrite").objectStore(STORES.effects).put(effect));
    return true;
  } finally {
    database.close();
  }
}

export async function putMetadata(key, value) {
  const database = await openDatabase();
  try {
    await requestToPromise(database.transaction(STORES.metadata, "readwrite").objectStore(STORES.metadata).put({ key, value }));
    return true;
  } finally {
    database.close();
  }
}

export async function putAudioBlob(projectId, kind, blob) {
  const database = await openDatabase();
  const key = `${projectId}:${kind}`;
  try {
    await requestToPromise(database.transaction(STORES.blobs, "readwrite").objectStore(STORES.blobs).put({ key, projectId, kind, blob }));
    return true;
  } finally {
    database.close();
  }
}

export async function getAudioBlob(projectId, kind) {
  const database = await openDatabase();
  try {
    const record = await requestToPromise(database.transaction(STORES.blobs, "readonly").objectStore(STORES.blobs).get(`${projectId}:${kind}`));
    return record?.blob || null;
  } finally {
    database.close();
  }
}

export async function deleteProjectAudio(projectId) {
  const database = await openDatabase();
  const transaction = database.transaction(STORES.blobs, "readwrite");
  const store = transaction.objectStore(STORES.blobs);
  store.delete(`${projectId}:original`);
  store.delete(`${projectId}:processed`);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => { database.close(); resolve(true); };
    transaction.onerror = () => { database.close(); reject(transaction.error || new Error("Não foi possível remover o áudio")); };
  });
}

export async function migrateLocalStorageProjects(storageKey = "fernando-lucoco-music-projects") {
  if (!isSupported()) return { migrated: false, reason: "indexeddb-unavailable", count: 0 };
  let projects;
  try {
    projects = JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return { migrated: false, reason: "invalid-local-data", count: 0 };
  }
  if (!Array.isArray(projects) || projects.length === 0) return { migrated: false, reason: "nothing-to-migrate", count: 0 };
  for (const project of projects) {
    await putProject({ ...project, migratedAt: new Date().toISOString() });
    await putTake({
      id: project.id,
      projectId: project.id,
      originalAudioData: Boolean(project.originalAudioData || project.audioData),
      processedAudioData: Boolean(project.processedAudioData),
      migratedAt: new Date().toISOString(),
    });
  }
  await putMetadata("lastMigration", { storageKey, count: projects.length, at: new Date().toISOString() });
  return { migrated: true, reason: "completed", count: projects.length };
}

export const INDEXED_DB_SCHEMA = {
  database: DB_NAME,
  version: DB_VERSION,
  stores: Object.values(STORES),
  strategy: "optional-progressive-migration-with-localStorage-fallback",
};
