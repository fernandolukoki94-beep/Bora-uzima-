import { normalizeProject } from "./project-model.js";

function timestamp() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function updateProject(project, tracks) {
  return { ...normalizeProject(project), tracks, updatedAt: timestamp() };
}

function mapClip(project, trackId, clipId, mapper) {
  const normalized = normalizeProject(project);
  const tracks = normalized.tracks.map((track) => {
    if (track.id !== trackId) return track;
    return { ...track, clips: track.clips.flatMap((clip) => clip.id === clipId ? mapper(clone(clip)) : [clip]) };
  });
  return updateProject(normalized, tracks);
}

export function moveClip(project, trackId, clipId, start) {
  const safeStart = Math.max(0, Number(start) || 0);
  return mapClip(project, trackId, clipId, (clip) => [{ ...clip, start: safeStart }]);
}

export function setClipGain(project, trackId, clipId, gain) {
  const safeGain = Math.max(0, Math.min(2, Number(gain) || 0));
  return mapClip(project, trackId, clipId, (clip) => [{ ...clip, gain: safeGain }]);
}

export function setClipFade(project, trackId, clipId, fadeIn, fadeOut) {
  return mapClip(project, trackId, clipId, (clip) => [{
    ...clip,
    fadeIn: Math.max(0, Math.min(clip.duration, Number(fadeIn) || 0)),
    fadeOut: Math.max(0, Math.min(clip.duration, Number(fadeOut) || 0)),
  }]);
}

export function deleteClip(project, trackId, clipId) {
  const normalized = normalizeProject(project);
  const tracks = normalized.tracks.map((track) => track.id === trackId
    ? { ...track, clips: track.clips.filter((clip) => clip.id !== clipId) }
    : track);
  return updateProject(normalized, tracks);
}

export function duplicateClip(project, trackId, clipId, offset = 0) {
  const normalized = normalizeProject(project);
  const tracks = normalized.tracks.map((track) => {
    if (track.id !== trackId) return track;
    const source = track.clips.find((clip) => clip.id === clipId);
    if (!source) return track;
    const copy = { ...clone(source), id: `${source.id}-copy-${Date.now()}`, start: Math.max(0, source.start + Number(offset || source.duration || 0)) };
    return { ...track, clips: [...track.clips, copy] };
  });
  return updateProject(normalized, tracks);
}

export function splitClip(project, trackId, clipId, atSeconds) {
  const normalized = normalizeProject(project);
  const tracks = normalized.tracks.map((track) => {
    if (track.id !== trackId) return track;
    const source = track.clips.find((clip) => clip.id === clipId);
    const relative = Number(atSeconds) - Number(source?.start || 0);
    if (!source || relative <= 0 || relative >= source.duration) return track;
    const left = { ...clone(source), id: `${source.id}-a`, duration: relative };
    const right = {
      ...clone(source),
      id: `${source.id}-b`,
      start: source.start + relative,
      duration: source.duration - relative,
      sourceOffset: source.sourceOffset + relative,
    };
    return { ...track, clips: track.clips.flatMap((clip) => clip.id === clipId ? [left, right] : [clip]) };
  });
  return updateProject(normalized, tracks);
}

export function trimClip(project, trackId, clipId, startOffset, duration) {
  return mapClip(project, trackId, clipId, (clip) => {
    const offset = Math.max(0, Number(startOffset) || 0);
    const maxDuration = Math.max(0, clip.duration - offset);
    const nextDuration = Math.max(0, Math.min(maxDuration, Number(duration) || maxDuration));
    return [{ ...clip, sourceOffset: clip.sourceOffset + offset, duration: nextDuration }];
  });
}
