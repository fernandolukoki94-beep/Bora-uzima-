import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getDownloadURL, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";
import { db, storage } from "./firebase-client.js";

export const MAX_MEDIA_BYTES = 80 * 1024 * 1024;
export const ALLOWED_MEDIA_PREFIXES = ["audio/", "video/", "image/"];

export function validateMediaFile(file, maxBytes = MAX_MEDIA_BYTES) {
  if (!file || typeof file !== "object") throw new Error("Escolhe um ficheiro de media.");
  const type = String(file.type || "").toLowerCase();
  if (!ALLOWED_MEDIA_PREFIXES.some((prefix) => type.startsWith(prefix))) {
    throw new Error("Formato não suportado. Usa áudio, vídeo ou imagem.");
  }
  if (Number(file.size || 0) > maxBytes) {
    throw new Error(`O ficheiro excede o limite de ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  }
  return true;
}

export function normalizeMediaMetadata({ name = "", folder = "Raiz", tags = "", type = "", size = 0 } = {}) {
  return {
    name: String(name).trim().slice(0, 120) || "Media sem nome",
    folder: String(folder).trim().slice(0, 60) || "Raiz",
    tags: String(tags).split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 20),
    type: String(type).toLowerCase(),
    size: Number(size) || 0,
  };
}

export async function uploadUserMedia(user, file, metadata = {}) {
  if (!user?.uid) throw new Error("Inicia sessão para sincronizar media.");
  validateMediaFile(file);
  const safe = normalizeMediaMetadata({ ...metadata, type: file.type, size: file.size });
  const mediaId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const objectRef = ref(storage, `users/${user.uid}/media/${mediaId}`);
  await uploadBytes(objectRef, file, { contentType: file.type });
  const downloadUrl = await getDownloadURL(objectRef);
  const mediaDoc = await addDoc(collection(db, "users", user.uid, "media"), {
    ...safe,
    mediaId,
    storagePath: objectRef.fullPath,
    downloadUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: mediaDoc.id, mediaId, downloadUrl, storagePath: objectRef.fullPath, ...safe };
}
