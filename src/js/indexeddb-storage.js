const DB_NAME = "fernando-lucoco-music";
const DB_VERSION = 1;
const AUDIO_STORE = "audio-blobs";

function isSupported() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDatabase() {
  if (!isSupported()) return Promise.reject(new Error("IndexedDB indisponível"));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(AUDIO_STORE)) {
        database.createObjectStore(AUDIO_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Não foi possível abrir IndexedDB"));
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

export async function putAudioBlob(projectId, kind, blob) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(AUDIO_STORE, "readwrite");
    transaction.objectStore(AUDIO_STORE).put(blob, `${projectId}:${kind}`);
    transaction.oncomplete = () => {
      database.close();
      resolve(true);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error("Não foi possível guardar o áudio"));
    };
  });
}

export async function getAudioBlob(projectId, kind) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(AUDIO_STORE, "readonly").objectStore(AUDIO_STORE).get(`${projectId}:${kind}`);
    request.onsuccess = () => {
      database.close();
      resolve(request.result || null);
    };
    request.onerror = () => {
      database.close();
      reject(request.error || new Error("Não foi possível ler o áudio"));
    };
  });
}

export async function deleteProjectAudio(projectId) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(AUDIO_STORE, "readwrite");
    const store = transaction.objectStore(AUDIO_STORE);
    store.delete(`${projectId}:original`);
    store.delete(`${projectId}:processed`);
    transaction.oncomplete = () => {
      database.close();
      resolve(true);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error("Não foi possível remover o áudio"));
    };
  });
}

export const INDEXED_DB_SCHEMA = {
  database: DB_NAME,
  version: DB_VERSION,
  stores: [AUDIO_STORE],
  strategy: "metadata-localStorage-audio-IndexedDB-with-fallback",
};
