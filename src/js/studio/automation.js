const AUTOMATION_TARGETS = new Set(["volume", "pan", "fx"]);

function finite(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, finite(value, min)));
}

export function normalizeAutomationPoint(point = {}, target = "volume") {
  const safeTarget = AUTOMATION_TARGETS.has(target) ? target : "volume";
  const time = Math.max(0, finite(point.time, 0));
  const value = safeTarget === "volume"
    ? clamp(point.value, 0, 2)
    : safeTarget === "pan"
      ? clamp(point.value, -1, 1)
      : clamp(point.value, 0, 1);
  return { time: Number(time.toFixed(4)), value: Number(value.toFixed(4)) };
}

export function normalizeAutomationLane(lane = {}, target = "volume") {
  const safeTarget = AUTOMATION_TARGETS.has(target) ? target : "volume";
  const points = Array.isArray(lane?.points) ? lane.points : [];
  const normalized = points
    .map((point) => normalizeAutomationPoint(point, safeTarget))
    .sort((left, right) => left.time - right.time);
  const deduped = [];
  normalized.forEach((point) => {
    const previous = deduped[deduped.length - 1];
    if (previous && previous.time === point.time) deduped[deduped.length - 1] = point;
    else deduped.push(point);
  });
  return { enabled: lane?.enabled !== false, target: safeTarget, fxIndex: safeTarget === "fx" ? Math.max(0, Math.floor(finite(lane?.fxIndex, 0))) : null, points: deduped };
}

export function normalizeTrackAutomation(automation = {}) {
  const lanes = Array.isArray(automation?.lanes) ? automation.lanes : [];
  return {
    enabled: automation?.enabled !== false,
    lanes: lanes.map((lane) => normalizeAutomationLane(lane, lane?.target)).filter((lane) => lane.points.length),
  };
}

export function upsertAutomationPoint(automation, target, point, fxIndex = 0) {
  const normalized = normalizeTrackAutomation(automation);
  const safeTarget = AUTOMATION_TARGETS.has(target) ? target : "volume";
  const keyIndex = safeTarget === "fx" ? Math.max(0, Math.floor(finite(fxIndex, 0))) : null;
  const lanes = normalized.lanes.map((lane) => ({ ...lane, points: [...lane.points] }));
  let lane = lanes.find((item) => item.target === safeTarget && item.fxIndex === keyIndex);
  if (!lane) {
    lane = normalizeAutomationLane({ target: safeTarget, fxIndex: keyIndex, points: [] }, safeTarget);
    lanes.push(lane);
  }
  const nextPoint = normalizeAutomationPoint(point, safeTarget);
  const index = lane.points.findIndex((item) => item.time === nextPoint.time);
  if (index >= 0) lane.points[index] = nextPoint;
  else lane.points.push(nextPoint);
  lane.points.sort((left, right) => left.time - right.time);
  return { enabled: normalized.enabled, lanes };
}

export function removeAutomationPoint(automation, target, time, fxIndex = 0) {
  const normalized = normalizeTrackAutomation(automation);
  const safeTarget = AUTOMATION_TARGETS.has(target) ? target : "volume";
  const keyIndex = safeTarget === "fx" ? Math.max(0, Math.floor(finite(fxIndex, 0))) : null;
  return {
    enabled: normalized.enabled,
    lanes: normalized.lanes
      .map((lane) => lane.target === safeTarget && lane.fxIndex === keyIndex
        ? { ...lane, points: lane.points.filter((point) => point.time !== Number(time)) }
        : lane)
      .filter((lane) => lane.points.length),
  };
}

export function evaluateAutomationLane(lane, time, fallback) {
  const normalized = normalizeAutomationLane(lane, lane?.target);
  const points = normalized.points;
  if (!normalized.enabled || !points.length) return fallback;
  const safeTime = Math.max(0, finite(time, 0));
  if (safeTime <= points[0].time) return points[0].value;
  const last = points[points.length - 1];
  if (safeTime >= last.time) return last.value;
  for (let index = 1; index < points.length; index += 1) {
    const right = points[index];
    const left = points[index - 1];
    if (safeTime <= right.time) {
      const span = right.time - left.time || 1;
      const ratio = (safeTime - left.time) / span;
      return left.value + (right.value - left.value) * ratio;
    }
  }
  return fallback;
}

export function evaluateTrackAutomation(track, time) {
  const automation = normalizeTrackAutomation(track?.automation);
  const values = { volume: finite(track?.volume, 1), pan: finite(track?.pan, 0), fx: {} };
  if (!automation.enabled) return values;
  automation.lanes.forEach((lane) => {
    if (lane.target === "fx") values.fx[lane.fxIndex] = evaluateAutomationLane(lane, time, 0.5);
    else values[lane.target] = evaluateAutomationLane(lane, time, values[lane.target]);
  });
  return values;
}

export const AUTOMATION_TARGETS_LIST = ["volume", "pan", "fx"];
