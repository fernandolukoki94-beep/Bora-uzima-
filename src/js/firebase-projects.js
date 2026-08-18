import {
  auth,
  db,
  ensureUserProfile,
} from "./firebase-client.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const MAX_TEXT = 320;

function currentUser() {
  if (!auth.currentUser?.uid) throw new Error("Inicia sessão para sincronizar projectos.");
  return auth.currentUser;
}

function text(value, max = MAX_TEXT) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cloudProjectPayload(project) {
  return {
    id: text(project.id, 128),
    ownerId: currentUser().uid,
    name: text(project.name, 80) || "Sessão sem nome",
    genre: text(project.genre, 80),
    preset: text(project.preset, 80),
    productionBrief: text(project.productionBrief, 320),
    tempo: Number.isFinite(project.tempo) ? project.tempo : 100,
    key: text(project.key, 24) || "C",
    duration: Number.isFinite(project.duration) ? project.duration : 0,
    durationLabel: text(project.durationLabel, 32),
    status: text(project.status, 120),
    createdAtLabel: text(project.createdAt, 80),
    visibility: "private",
    processing: project.processing || null,
    analysis: project.analysis || null,
    manualAnalysis: project.manualAnalysis || null,
    producerPlan: project.producerPlan || null,
    aiRecommendation: project.aiRecommendation || null,
    aiRecommendedPlan: project.aiRecommendedPlan || null,
    importedBeat: project.importedBeat ? {
      name: text(project.importedBeat.name, 160),
      type: text(project.importedBeat.type, 80),
      size: Number(project.importedBeat.size) || 0,
      storageKey: text(project.importedBeat.storageKey, 128),
    } : null,
    activeEffectPresetId: text(project.activeEffectPresetId, 128),
    activeEffectPreset: project.activeEffectPreset || null,
    audioSettings: project.audioSettings || null,
    audioPolicy: "audio-local-indexeddb",
    updatedAt: serverTimestamp(),
    createdAt: project.cloudCreatedAt || serverTimestamp(),
  };
}

export async function syncProfilePreferences(preferences = {}) {
  const user = currentUser();
  await ensureUserProfile(user, preferences.artist || user.displayName || "");
  await setDoc(doc(db, "users", user.uid), {
    displayName: text(preferences.artist, 80) || user.displayName || "Artista",
    profile: {
      name: text(preferences.name, 80),
      username: text(preferences.username, 32).replace(/^@/, ""),
      artistName: text(preferences.artist, 80) || user.displayName || "Artista",
      location: text(preferences.location, 80),
      objectives: Array.isArray(preferences.objectives) ? preferences.objectives.map((item) => text(item, 48)).filter(Boolean).slice(0, 8) : [],
    },
    preferences: {
      genre: text(preferences.genre, 80) || "Afrobeat",
      instrument: text(preferences.instrument, 80) || "Vocal",
    },
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function saveCloudProject(project) {
  const user = currentUser();
  const payload = cloudProjectPayload(project);
  if (!payload.id) throw new Error("Projecto sem identificador.");
  await setDoc(doc(db, "projects", payload.id), payload, { merge: true });
  return { ...payload, cloudSynced: true, ownerId: user.uid };
}

export async function listCloudProjects() {
  const user = currentUser();
  const snapshot = await getDocs(query(collection(db, "projects"), where("ownerId", "==", user.uid)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function getCloudProject(projectId) {
  currentUser();
  const snapshot = await getDoc(doc(db, "projects", projectId));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export function cloudProjectToLocal(project) {
  if (!project?.id) return null;
  return {
    id: project.id,
    name: project.name || "Sessão cloud",
    genre: project.genre || "Demo vocal",
    preset: project.preset || "Natural",
    productionBrief: project.productionBrief || "",
    tempo: project.tempo || 100,
    key: project.key || "C",
    duration: project.duration || 0,
    durationLabel: project.durationLabel || "duração não registada",
    status: project.status || "Manifesto cloud sincronizado",
    createdAt: project.createdAtLabel || "Projecto cloud",
    processing: project.processing || null,
    analysis: project.analysis || null,
    manualAnalysis: project.manualAnalysis || null,
    producerPlan: project.producerPlan || null,
    aiRecommendation: project.aiRecommendation || null,
    aiRecommendedPlan: project.aiRecommendedPlan || null,
    importedBeat: project.importedBeat || null,
    activeEffectPresetId: project.activeEffectPresetId || "",
    activeEffectPreset: project.activeEffectPreset || null,
    audioSettings: project.audioSettings || null,
    originalAudioData: null,
    processedAudioData: null,
    audioVariants: {},
    cloudSynced: true,
    audioPolicy: "audio-local-indexeddb",
  };
}

export function isFirebaseSignedIn() {
  return Boolean(auth.currentUser?.uid);
}

export { cloudProjectPayload };

export const FIREBASE_PROJECTS_LIMITS = Object.freeze({ maxText: MAX_TEXT, audioPolicy: "local-only" });
