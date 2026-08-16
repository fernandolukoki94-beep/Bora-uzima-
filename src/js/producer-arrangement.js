import { addClip, addTrack, normalizeProject } from "./studio/project-model.js";
import { producerPlanClipSpecs } from "./producer-plan.js";

function trackStyle(type) {
  if (type === "drums") return { name: "Beat Maker", color: "#f4b860" };
  if (type === "guitar") return { name: "Guitarra", color: "#9c8cff" };
  return { name: type === "instrument" ? "Instrumento" : type, color: "#62d6c7" };
}

/** Returns the visible provenance of a timeline track. */
export function trackOrigin(track) {
  return track?.clips?.some((clip) => clip.event?.producerPlan) ? "producer-plan" : "manual";
}

/** Materialises a deterministic Producer Plan into real timeline tracks/clips. */
export function materializeProducerPlan(project, plan, { duration = project?.duration || 8, onStep } = {}) {
  let next = removePreviousPlanClips(applyPlanMetadata(normalizeProject(project), plan));
  const clipDuration = Math.max(4, Math.min(16, Number(duration || 8)));
  const specs = producerPlanClipSpecs(plan, clipDuration);
  for (const [index, spec] of specs.entries()) {
    let track = next.tracks.find((item) => item.type === spec.type);
    if (!track) {
      const style = trackStyle(spec.type);
      next = addTrack(next, { name: style.name, type: spec.type, color: style.color });
      track = next.tracks[next.tracks.length - 1];
    }
    const end = track.clips.reduce((latest, clip) => Math.max(latest, Number(clip.start || 0) + Number(clip.duration || 0)), 0);
    next = addClip(next, track.id, {
      name: spec.name,
      start: end,
      duration: spec.duration,
      sourceOffset: 0,
      mimeType: "application/x-fernando-lucoco-event",
      event: spec.metadata,
    });
    onStep?.({ index: index + 1, total: specs.length, spec });
  }
  return next;
}

function removePreviousPlanClips(project) {
  return {
    ...project,
    tracks: project.tracks.map((track) => ({
      ...track,
      clips: track.clips.filter((clip) => !clip.event?.producerPlan),
    })),
  };
}

function applyPlanMetadata(project, plan) {
  return {
    ...project,
    tempo: plan.bpm,
    key: plan.key,
    producerPlan: plan,
    updatedAt: new Date().toISOString(),
  };
}
