const PROJECT_SCHEMA_VERSION = 3;
const DEFAULT_TEMPO = 100;
const DEFAULT_KEY = "C";
const DEFAULT_TIME_SIGNATURE = "4/4";

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  const random = globalThis.crypto?.randomUUID?.();
  return `${prefix}-${random || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

export function createTrack({ id = makeId("track"), name = "Lead Vocal", type = "audio", color = "#f06aa8" } = {}) {
  return {
    id,
    name,
    type,
    color,
    volume: 1,
    pan: 0,
    muted: false,
    solo: false,
    clips: [],
    effects: [],
  };
}

export function createClip({ id = makeId("clip"), blobKey = null, start = 0, duration = 0, sourceOffset = 0, name = "Audio Clip", mimeType = null } = {}) {
  return {
    id,
    name,
    blobKey,
    start,
    duration,
    sourceOffset,
    mimeType,
    gain: 1,
    fadeIn: 0,
    fadeOut: 0,
  };
}

export function createProject({ id = makeId("project"), name = "Novo projecto", tempo = DEFAULT_TEMPO, key = DEFAULT_KEY } = {}) {
  const timestamp = nowIso();
  return {
    id,
    name,
    tempo,
    key,
    timeSignature: DEFAULT_TIME_SIGNATURE,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    tracks: [createTrack()],
    effects: [],
    markers: [],
    history: { past: [], future: [] },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function legacyAudioClip(project) {
  const hasAudio = Boolean(project.originalAudioData || project.processedAudioData || project.audioData);
  if (!hasAudio) return null;
  return createClip({
    id: `${project.id}-clip-original`,
    blobKey: `${project.id}:original`,
    duration: Number(project.duration || 0),
    name: project.name || "Vocal Take",
    mimeType: project.originalMimeType || project.mimeType || null,
  });
}

export function normalizeProject(input = {}) {
  const source = input || {};
  const base = createProject({
    id: source.id || undefined,
    name: source.name || "Novo projecto",
    tempo: Number.isFinite(Number(source.tempo)) ? Number(source.tempo) : DEFAULT_TEMPO,
    key: source.key || DEFAULT_KEY,
  });
  const legacyClip = legacyAudioClip(source);
  const sourceTracks = Array.isArray(source.tracks) ? source.tracks : [];
  const tracks = sourceTracks.length
    ? sourceTracks.map((track, index) => ({
        ...createTrack({
          id: track.id || `${source.id || base.id}-track-${index + 1}`,
          name: track.name || `Track ${index + 1}`,
          type: track.type || "audio",
          color: track.color || undefined,
        }),
        ...track,
        clips: Array.isArray(track.clips) ? track.clips.map((clip) => ({ ...createClip(clip), ...clip })) : [],
        effects: Array.isArray(track.effects) ? [...track.effects] : [],
      }))
    : [
        {
          ...base.tracks[0],
          clips: legacyClip ? [legacyClip] : [],
        },
      ];

  return {
    ...base,
    ...source,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    tempo: Number.isFinite(Number(source.tempo)) ? Number(source.tempo) : DEFAULT_TEMPO,
    key: source.key || DEFAULT_KEY,
    timeSignature: source.timeSignature || DEFAULT_TIME_SIGNATURE,
    tracks,
    effects: Array.isArray(source.effects) ? [...source.effects] : [],
    markers: Array.isArray(source.markers) ? [...source.markers] : [],
    history: {
      past: Array.isArray(source.history?.past) ? [...source.history.past] : [],
      future: Array.isArray(source.history?.future) ? [...source.history.future] : [],
    },
    updatedAt: source.updatedAt || nowIso(),
  };
}

export function addTrack(project, trackOptions = {}) {
  const normalized = normalizeProject(project);
  const track = createTrack(trackOptions);
  return { ...normalized, tracks: [...normalized.tracks, track], updatedAt: nowIso() };
}

export function addClip(project, trackId, clipOptions = {}) {
  const normalized = normalizeProject(project);
  const clip = createClip(clipOptions);
  const tracks = normalized.tracks.map((track) => track.id === trackId ? { ...track, clips: [...track.clips, clip] } : track);
  return { ...normalized, tracks, updatedAt: nowIso() };
}

export function updateTrack(project, trackId, changes = {}) {
  const normalized = normalizeProject(project);
  return {
    ...normalized,
    tracks: normalized.tracks.map((track) => track.id === trackId ? { ...track, ...changes } : track),
    updatedAt: nowIso(),
  };
}

export function updateClip(project, trackId, clipId, changes = {}) {
  const normalized = normalizeProject(project);
  return {
    ...normalized,
    tracks: normalized.tracks.map((track) => track.id !== trackId ? track : {
      ...track,
      clips: track.clips.map((clip) => clip.id === clipId ? { ...clip, ...changes } : clip),
    }),
    updatedAt: nowIso(),
  };
}

export function serializeProject(project) {
  return JSON.parse(JSON.stringify(normalizeProject(project)));
}

export const PROJECT_SCHEMA = {
  version: PROJECT_SCHEMA_VERSION,
  required: ["id", "name", "tempo", "key", "tracks", "effects", "markers", "createdAt", "updatedAt"],
};
